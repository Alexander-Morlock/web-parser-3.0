import { delay, downloadImage, generateImagePath, saveTexts } from "./utils"
import { JSDOM } from "jsdom"
import { ImageParserConfig, ParserConfig } from "./types"

export function parse({
  domainName,
  productCodes,
  productUrls,
  requestDelay = 50,
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

  Promise.all(
    productCodes.map(async (productCode, productCodesIterationIndex) => {
      {
        await delay(requestDelay)

        try {
          const productUrl = productUrls[productCodes.indexOf(productCode)]
          const response = await fetch(encodeURI(productUrl))
          const text = await response.text()
          const html = new JSDOM(text).window.document

          await downloadImages(
            imageParsers,
            html,
            domainName,
            folderName,
            productCode
          )

          // Parsing texts
          const textRow: string | undefined = textParsers
            ?.map(({ selector }) =>
              Array.from(html.querySelectorAll(selector)) // nodes to parse
                .map((node) => node.textContent?.replace(/[\t\n]/g, ""))
                .join("\t")
            )
            .join("\t")

          texts.push(`${productCode}\t${productUrl}\t${textRow}`)

          const isLastIteration =
            productCodesIterationIndex === productCodes.length - 1

          if (!isLastIteration || !textParsers) {
            return
          }

          await saveTexts("texts.txt", folderName, texts.join("\n"))
        } catch (error) {
          console.log("ERROR -> ", error)
        }
      }
    })
  ).then(() => console.log("-----------------> JOB IS DONE <-----------------"))
}

/** Downloading images from parsed urls */
function downloadImages(
  imageParsers: ImageParserConfig<HTMLElement>[] | undefined,
  html: Document,
  domainName: string,
  folderName: string,
  productCode: string
) {
  return new Promise((resolve) => {
    imageParsers?.forEach(async ({ selector, source, maxNumberOfImages }) => {
      const nodesToExtractImageUrl = Array.from(html.querySelectorAll(selector))
      const parsedUrls = nodesToExtractImageUrl
        .map((node) => String(node[source as keyof Element]))
        .slice(0, maxNumberOfImages)

      Promise.all(
        parsedUrls.map((parsedUrl, index) => {
          const url = parsedUrl.includes(domainName)
            ? parsedUrl
            : `${domainName}/${parsedUrl}`.replace(/\/+/g, "/")
          const path = generateImagePath(folderName, productCode, index)
          return downloadImage(path, url)
        })
      ).then(resolve)
    })
  })
}
