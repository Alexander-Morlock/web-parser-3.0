import {
  delay,
  downloadImage,
  generateImagePath,
  getProgress,
  saveTexts,
} from "./utils"
import { JSDOM } from "jsdom"
import { ImageParserConfig, ParserConfig } from "./types"

export async function parse({
  domainName,
  productCodes,
  productUrls,
  folderName,
  imageParsers,
  textParsers,
}: ParserConfig) {
  if (!productCodes || !productUrls) {
    return
  }

  const texts: string[] = []
  const textsHeaderRow = textParsers?.map(({ name }) => name).join("\t")
  textsHeaderRow && texts.push(`ART\tURL\t${textsHeaderRow}\n`)

  for (let i = 0; i < productCodes.length; i++) {
    const productCode = productCodes[i]

    try {
      const productUrl = productUrls[productCodes.indexOf(productCode)] ?? ""

      const response = await fetch(encodeURI(productUrl))
      const text = await response.text()
      const html = new JSDOM(text).window.document

      if (imageParsers) {
        console.log(
          getProgress(i, productCodes.length),
          "PARSING...",
          productCode
        )

        await downloadImages(
          imageParsers,
          html,
          domainName,
          folderName,
          productCode
        )
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

      const isLastIteration = i === productCodes.length - 1

      if (isLastIteration) {
        textParsers && saveTexts("texts.txt", folderName, texts.join("\n"))
        console.log("----------> JOB IS DONE <----------")
      }
    } catch (e) {
      console.log(`ERROR -> ${productCode}`)
    }
  }
}

/** Downloading images from parsed urls */
function downloadImages(
  imageParsers: ImageParserConfig<HTMLElement>[],
  html: Document,
  domainName: string,
  folderName: string,
  productCode: string
) {
  const imagesToParse = imageParsers
    .map(({ selector, source, maxNumberOfImages }) => {
      const nodesToExtractImageUrl = Array.from(html.querySelectorAll(selector))
      return nodesToExtractImageUrl
        .map((node) => String(node[source as keyof Element]))
        .slice(0, maxNumberOfImages)
    })
    .flat()
    .map((parsedUrl, index) => {
      const url = parsedUrl.includes(domainName)
        ? parsedUrl
        : `${domainName}/${parsedUrl}`.replace(/\/+/g, "/")
      const path = generateImagePath(folderName, productCode, index)

      return { path, url }
    })

  return Promise.all(
    imagesToParse.map(({ path, url }) => downloadImage(path, url))
  )
}
