import { consoParserConfig, consoPreviewImagesParser } from "./parserConfig"
import { parse } from "../../utils/parse"
import {
  exctractUrlsFromBackup,
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

  const backup = await exctractUrlsFromBackup(consoParserConfig.folderName)

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    const backupUrl = backup[item.ART]
    const URL =
      backupUrl ??
      (await getUrlFromConsowearSearchResult(item.ART)) ??
      (await getUrlFromWebfolder(item.ART, imagesHostingUrl, () =>
        console.log(
          getProgress(i, data.length),
          "Parsed from WebFolder ->",
          item.ART
        )
      ))

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
  const getPath = (postfix?: string) =>
    new URL(
      `${imagesFolderUrl}/${filename}${INDEX ? `_${INDEX}` : ""}${
        postfix ?? ""
      }.jpg`
    ).href

  return `[url=${getPath("_enl")} height=500][img]${getPath()}[/img][/url]`
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

function getUrlFromWebfolder(
  productCode: string,
  imagesHostingUrl: string,
  onSuccess: () => void
) {
  return new Promise<string | undefined>(async (resolve, reject) => {
    const url = new URL(`${imagesHostingUrl}/${productCode}_enl.jpg`).href

    try {
      const response = await fetch(url)
      if (response.status === 200) {
        onSuccess()
        return resolve(url)
      }

      const productCodeWithNoColor = productCode.split(" - ")[0]
      const urlWithNoColor = new URL(
        `${imagesHostingUrl}/${productCodeWithNoColor}_enl.jpg`
      ).href

      const responseNoColor = await fetch(urlWithNoColor)
      if (responseNoColor.status === 200) {
        onSuccess()
        resolve(urlWithNoColor)
      }

      resolve(undefined)
    } catch (error) {
      reject(error)
    }
  })
}
