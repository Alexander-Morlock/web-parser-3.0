import { delay, downloadImage, generateImagePath, saveTexts } from "./utils"
import { JSDOM } from "jsdom"
import { ParserConfig } from "./types"

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

  productCodes.forEach(async (productCode, productCodesIterationIndex) => {
    {
      await delay(requestDelay)

      const productUrl = productUrls[productCodes.indexOf(productCode)]
      const response = await fetch(encodeURI(productUrl))
      const text = await response.text()
      const html = new JSDOM(text).window.document

      // Downloading images from parsed urls
      imageParsers?.forEach(async ({ selector, source, maxNumberOfImages }) => {
        const nodesToExtractImageUrl = Array.from(
          html.querySelectorAll(selector)
        )
        const parsedUrls = nodesToExtractImageUrl
          .map((node) => String(node[source as keyof Element]))
          .slice(0, maxNumberOfImages)

        parsedUrls.forEach(async (parsedUrl, index) => {
          const url = parsedUrl.includes(domainName)
            ? parsedUrl
            : `${domainName}/${parsedUrl}`.replace(/\/+/g, "/")
          const path = generateImagePath(folderName, productCode, index)

          await downloadImage(path, url)
        })
      })

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
    }
  })
}
