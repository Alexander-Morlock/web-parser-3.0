import path from "path"
import fs from "fs"
import { consoParserConfig, consoPreviewImagesParser } from "./parserConfig"
import { parse } from "../../utils/parse"
import {
  getProgress,
  replaceSlashesWithAmpersands,
  saveTexts,
  URLS_BACKUP_FILENAME,
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

type ParseConsoWearProps = {
  data: ConsoWearMultipleSizesExcelRow[]
  imagesHostingUrl: string
}

type DataEnhancedWithPossibleUrls = (ConsoWearMultipleSizesExcelRow & {
  URL?: string
})[]

export async function parseConsoWear({
  data,
  imagesHostingUrl,
}: ParseConsoWearProps) {
  const dataEnhancedWithPossibleUrls: DataEnhancedWithPossibleUrls = []

  const backup = await exctractUrlsFromBackup()

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    const backupUrl = backup[item.ART]
    const URL = backupUrl ?? (await getUrlFromConsowearSearchResult(item.ART))

    dataEnhancedWithPossibleUrls.push({ ...item, URL })
    await createBackup(dataEnhancedWithPossibleUrls)

    console.log(
      getProgress(i, data.length),
      item.ART,
      " -> ",
      `${backupUrl ? "[From backup] " : ""}${URL ?? "---"}`
    )
  }

  const html = generateHtml(dataEnhancedWithPossibleUrls, imagesHostingUrl)

  await saveTexts("excell.txt", "consowear/html", html)
  await saveTexts(
    "copy-paste.txt",
    "consowear/html",
    html.replace(/\t/g, "").replace(/\[br\]/g, "\n")
  )

  const dataWithUrls = dataEnhancedWithPossibleUrls.filter(({ URL }) => URL)

  // downloading images
  parse({
    ...consoParserConfig,
    productCodes: dataWithUrls.map((item) => item.ART),
    productUrls: dataWithUrls.map((item) => item.URL),
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

function generateHtml(
  dataEnhancedWithPossibleUrls: DataEnhancedWithPossibleUrls,
  imagesHostingUrl: string
) {
  return dataEnhancedWithPossibleUrls
    .map(({ ART, SIZES, SUBART, DESCRIPTION, PRICE, URL }) =>
      [
        "[color=blue][size=16pt]",
        ART,
        "[/size] * ",
        SIZES.join(", "),
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
        URL,
      ].join("\t")
    )
    .join("\n")
}

async function createBackup(
  dataEnhancedWithPossibleUrls: DataEnhancedWithPossibleUrls
) {
  const backup = dataEnhancedWithPossibleUrls
    .filter(({ URL }) => URL)
    .map(({ ART, URL }) => [ART, URL].join("\t"))
    .join("\n")

  if (!backup.length) {
    return Promise.resolve()
  }

  return saveTexts(URLS_BACKUP_FILENAME, "consowear/html", backup, false)
}

type ExctractUrlsFromBackup = { [key: string]: string | undefined }

export function exctractUrlsFromBackup() {
  return new Promise<ExctractUrlsFromBackup>((resolve, reject) =>
    fs.readFile(
      `parsed/consowear/html/${URLS_BACKUP_FILENAME}`,
      (err, data) => {
        if (err) {
          return reject(err)
        }

        const dataConvertedToUtf8 = Buffer.from(data.toJSON().data).toString(
          "utf-8"
        )

        const backup: ExctractUrlsFromBackup = {}

        dataConvertedToUtf8.split("\n").forEach((row) => {
          const [art, url] = row.split("\t")
          backup[art] = url
        })

        console.log("BACKUP FOUND")
        resolve(backup)
      }
    )
  )
}
