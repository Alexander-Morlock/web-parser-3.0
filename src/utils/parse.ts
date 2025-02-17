import { ResizeOptions } from "sharp"
import {
  downloadImage,
  generateImagePath,
  getProgress,
  saveTexts,
} from "./utils"
import { JSDOM } from "jsdom"
import { ImageParserConfig, ParserConfig } from "./types"
import { consoParserConfig } from "../parsers/conso/parserConfig"

export async function parse({
  domainName,
  productCodes,
  productUrls,
  folderName,
  imageParsers,
  textParsers,
  resizeOptions,
  imagesHostingUrl,
}: ParserConfig) {
  if (!productCodes || !productUrls) {
    return
  }

  const texts: string[] = []
  const textsHeaderRow = textParsers?.map(({ name }) => name).join("\t")
  textsHeaderRow && texts.push(`ART\tURL\t${textsHeaderRow}\n`)

  for (let i = 0; i < productCodes.length; i++) {
    const productCode = productCodes[i]
    const productUrl = productUrls[i] ?? ""

    if (productUrl.includes(imagesHostingUrl)) {
      // Download image from hosting folder
      await downloadImage({
        ...generateImagePath(folderName, productCode),
        sourceImageUrl: productUrl,
        resizeOptions: consoParserConfig.resizeOptions,
      })
      console.log(
        getProgress(i, productCodes.length),
        "Saved from WebFolder...",
        productCode
      )
    } else {
      // Download image from parsed url
      try {
        const response = await fetch(encodeURI(productUrl))
        const text = await response.text()
        const html = new JSDOM(text).window.document

        if (imageParsers) {
          console.log(
            getProgress(i, productCodes.length),
            "PARSING...",
            productCode
          )

          await downloadImages({
            imageParsers,
            html,
            domainName,
            folderName,
            productCode,
            resizeOptions,
          })
        }

        // Parsing texts
        const textRow: string | undefined = textParsers
          ?.map(({ selector }) =>
            Array.from(html.querySelectorAll(selector)) // nodes to parse
              .map((node) => node.textContent?.replace(/[\t\n]/g, ""))
              .join("\t")
          )
          .join("\t")

        texts.push(`${productCode}\t${productUrl}\t${textRow}`)
      } catch (e) {
        console.log(`ERROR -> ${productCode}`)
      }
    }

    const isLastIteration = i === productCodes.length - 1

    if (isLastIteration) {
      textParsers && saveTexts("texts.txt", folderName, texts.join("\n"))
      console.log("----------> JOB IS DONE <----------")
    }
  }
}

type DownloadImagesProps = {
  imageParsers: ImageParserConfig<HTMLElement>[]
  html: Document
  domainName: string
  folderName: string
  productCode: string
  resizeOptions?: ResizeOptions
}

/** Downloading images from parsed urls */
function downloadImages({
  imageParsers,
  html,
  domainName,
  folderName,
  productCode,
  resizeOptions,
}: DownloadImagesProps) {
  const imagesToParse = imageParsers
    .map(({ selector, source, maxNumberOfImages }) => {
      const nodesToExtractImageUrl = Array.from(html.querySelectorAll(selector))
      return nodesToExtractImageUrl
        .map((node) => String(node[source as keyof Element]))
        .slice(0, maxNumberOfImages)
    })
    .flat()
    .map((parsedUrl, index) => {
      const sourceImageUrl = parsedUrl.includes(domainName)
        ? parsedUrl
        : `${domainName}/${parsedUrl}`.replace(/\/+/g, "/")
      const { path, fileName } = generateImagePath(
        folderName,
        productCode,
        index
      )

      return { path, fileName, sourceImageUrl }
    })

  return Promise.all(
    imagesToParse.map(({ path, fileName, sourceImageUrl }) =>
      downloadImage({
        path,
        fileName,
        sourceImageUrl,
        resizeOptions,
      })
    )
  )
}
