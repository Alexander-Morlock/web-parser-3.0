import { consoParserConfig, consoPreviewImagesParser } from "./parserConfig"
import { parse } from "../../utils/parse"
import {
  exctractUrlsFromBackup,
  getProgress,
  getUrlFromWebfolder,
  replaceSlashesWithAmpersands,
  roundNumberBy,
  saveTexts,
  URLS_BACKUP_FILENAME,
} from "../../utils/utils"
import { JSDOM } from "jsdom"
import {
  ConsoWearArchivePricesExcelRow,
  ConsoWearMultipleSizesExcelRow,
  ConsoWearSingleSizeExcelRow,
} from "./types"

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
  archivePrices?: ConsoWearArchivePricesExcelRow[]
  imagesHostingUrl: string
}

type DataEnhancedWithPossibleUrls = (ConsoWearMultipleSizesExcelRow & {
  URL?: string
})[]

export async function parseConsoWear({
  data,
  imagesHostingUrl,
  archivePrices,
}: ParseConsoWearProps) {
  const dataEnhancedWithPossibleUrls: DataEnhancedWithPossibleUrls = []

  const backup = await exctractUrlsFromBackup(consoParserConfig.folderName)

  for (let i = 0; i < data.length; i++) {
    const item = data[i]

    const backupUrl = backup[item.ART]
    const URL =
      backupUrl ??
      (await getUrlFromConsowearSearchResult(item.ART)) ??
      (await getUrlFromWebfolder(
        [`${item.ART}_enl.jpg`, `${item.ART.split(" - ")[0]}_enl.jpg`],
        imagesHostingUrl,
        () =>
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

  const html = generateHtml(
    dataEnhancedWithPossibleUrls,
    imagesHostingUrl,
    archivePrices
  )

  await saveTexts("excell.txt", "consowear/html", html)

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

  return `[url=${getPath("_enl")}][img]${getPath()}[/img][/url]`
}

function generateHtml(
  dataEnhancedWithPossibleUrls: DataEnhancedWithPossibleUrls,
  imagesHostingUrl: string,
  archivePrices?: ConsoWearArchivePricesExcelRow[]
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
        getArchivePrice(ART, "BEFORE", archivePrices),
        getArchivePrice(ART, "AFTER", archivePrices),
      ].join("\t")
    )
    .join("\n")
}

function getArchivePrice(
  ART: string,
  type: "BEFORE" | "AFTER",
  archivePrices?: ConsoWearArchivePricesExcelRow[]
) {
  return archivePrices?.find((price) => price.ART === ART)?.[type]
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

export function getConsoWearMultipleSizesExcelRowData(
  jsonData: ConsoWearSingleSizeExcelRow[]
) {
  const products: {
    [key: string]: ConsoWearMultipleSizesExcelRow
  } = {}

  jsonData.forEach(
    ({ ART, SUBART, SIZE, PRICE, MATERIALS, COLOR, DESCRIPTION }, INDEX) => {
      if (ART in products) {
        products[ART].SIZES = [...products[ART].SIZES, SIZE].sort()
      } else {
        products[ART] = {
          ART,
          SUBART,
          SIZES: [SIZE],
          PRICE: String(roundNumberBy(Number(PRICE), 10)),
          MATERIALS,
          COLOR,
          DESCRIPTION,
          INDEX,
        }
      }
    }
  )

  const data: ConsoWearMultipleSizesExcelRow[] = Object.entries(products)
    .map(([ART, product]) => ({ ...product, ART }))
    .sort((a, b) => a.INDEX - b.INDEX)

  return data
}
