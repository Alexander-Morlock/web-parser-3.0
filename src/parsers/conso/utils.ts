import { consoParserConfig, consoPreviewImagesParser } from "./parserConfig"
import { parse } from "../../utils/parse"
import {
  delay,
  replaceSlashesWithAmpersands,
  saveTexts,
} from "../../utils/utils"
import { JSDOM } from "jsdom"
import { ConsoWearMultipleSizesExcelRow } from "./types"

export function generateConsoSearchUrl(ART: string) {
  const prefix = "https://opt.consowear.ru/poisk?search="
  const search = ART.split(" ").join("+")
  return `${prefix}${search}`
}

export function getUrlFromConsowearSearchResult(ART: string) {
  return new Promise<string | undefined>(async (resolve) => {
    const response = await fetch(encodeURI(generateConsoSearchUrl(ART)))
    const text = await response.text()
    const html = new JSDOM(text).window.document
    const node = html.querySelector("a.models-name") as HTMLAnchorElement | null
    resolve(node?.href)
  })
}

type Props = {
  data: ConsoWearMultipleSizesExcelRow[]
  imagesHostingUrl: string
}

export async function parseConsoWear({ data, imagesHostingUrl }: Props) {
  const dataWithUrls: (ConsoWearMultipleSizesExcelRow & { URL?: string })[] = []

  for (let i = 0; i < data.length; i++) {
    await delay(300 * Math.random())
    const item = data[i]
    const URL = await getUrlFromConsowearSearchResult(item.ART)
    dataWithUrls.push({ ...item, URL })
  }

  const html = data
    .map(({ ART, SIZES, SUBART, DESCRIPTION, PRICE }) =>
      [
        "[color=blue][size=16pt]",
        ART,
        "[/size] * ",
        SIZES,
        " * [/color][br][b]",
        SUBART,
        "[/b][br][br]Описание: ",
        DESCRIPTION,
        "[br][br]",
        [...Array(consoPreviewImagesParser.maxNumberOfImages).keys()]
          .map((INDEX) =>
            generateHtmlImageWithLink(ART, INDEX, imagesHostingUrl)
          )
          .join(""),
        "[br][b]Цена розницы: [s]",
        PRICE,
        " руб.[/s]  [glow=red,2,300][color=beige]НАША ЦЕНА[/color][/glow]  ",
        PRICE,
        " руб.+%[/b][br][br]",
      ].join("\t")
    )
    .join("\n")

  saveTexts("excell.txt", "consowear/html", html)
  saveTexts(
    "copy-paste.txt",
    "consowear/html",
    html.replace(/\t/g, "").replace(/\[br\]/g, "\n")
  )

  // downloading images
  parse({
    ...consoParserConfig,
    productCodes: dataWithUrls.map((item) => item.ART),
    productUrls: dataWithUrls.map((item) => item.URL ?? ""),
  })
}

function generateHtmlImageWithLink(
  ART: string,
  INDEX = 0,
  imagesFolderUrl: string
) {
  const filename = replaceSlashesWithAmpersands(ART)
  const path = new URL(
    `${imagesFolderUrl}/${filename}${INDEX ? `_${INDEX}` : ""}.jpg`
  ).href

  return `[url=${path} height=500][img]${path}[/img][/url]`
}