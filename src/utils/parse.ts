import {
  createFolder,
  delay,
  downloadImage,
  generateImagePath,
  getTextsTabulated,
  saveTexts,
} from "./utils"
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
  createFolder(folderName)

  const texts: string[] = []
  const textsHeaderRow = textParsers?.map(({ name }) => name).join("\t")
  textsHeaderRow && texts.push(`${textsHeaderRow}\n`)

  productCodes.forEach(async (productCode) => {
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
      textParsers?.forEach(async ({ selector }) => {
        const nodesToExtractText = Array.from(html.querySelectorAll(selector))

        nodesToExtractText.forEach(async (node) => {
          const textRow = node.textContent?.replace(/[\t\n]/g, "")
          textRow && texts.push(textRow)
        })
      })

      texts.length &&
        saveTexts(
          "texts",
          folderName,
          getTextsTabulated(texts, textParsers?.length || 0)
        )
    }
  })
}
