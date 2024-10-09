import fs from "fs"
import https from "https"
import { ParserConfigType } from "./types"
import { charmanteParserConfig } from "../parserConfigs/charmante"
import { rusteacoParserConfig } from "../parserConfigs/rusteaco"

export const PATH_PREFIX = "parsed/"

export function createFolder(folderName: string) {
  try {
    if (!fs.existsSync(PATH_PREFIX)) {
      fs.mkdirSync(PATH_PREFIX)
    }

    const path = `${PATH_PREFIX}${folderName}`
    const imagesPath = `${path}/images`

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }

    if (!fs.existsSync(imagesPath)) {
      fs.mkdirSync(imagesPath)
    }
  } catch (err) {
    console.error(err)
  }
}

export async function delay(delayTimeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayTimeMs))
}

export async function downloadImage(path: string, imageUrl: string) {
  const file = fs.createWriteStream(path)

  https
    .get(imageUrl, (response) => {
      response.pipe(file)

      file.on("finish", () => {
        file.close()
        console.log(`Image downloaded as ${path}`)
      })
    })
    .on("error", (err) => {
      fs.unlink(path, () =>
        console.error(`Error downloading image: ${err.message}`)
      )
    })
}

export async function saveTexts(
  fileName: string,
  folderName: string,
  data: string
) {
  fs.writeFile(`${PATH_PREFIX}${folderName}/${fileName}.txt`, data, (err) => {
    if (err) {
      return console.log(err)
    }
    console.log(`${fileName} was saved!`)
  })
}

export function generateImagePath(
  folderName: string,
  productCode: string,
  index: number
) {
  const fileName = `${productCode}`.replace(/\/+/g, "&")
  const postFix = index ? `_${index}` : ""
  const path = `${PATH_PREFIX}${folderName}/images/${fileName}${postFix}.jpg`

  return path
}

export function getTextsTabulated(texts: string[], numberOfParsers: number) {
  const [headingRow] = texts
  const tabulatedTexts: string[] = [headingRow]

  for (let i = 1; i < texts.length - 1; i += numberOfParsers) {
    const row = texts.slice(i, i + numberOfParsers).join("\t")
    tabulatedTexts.push(row)
  }

  return tabulatedTexts.join("\n")
}

export function copyFrontendToDistr() {
  const fileNames = fs.readdirSync("src/frontend")
  fileNames.forEach((fileName) =>
    fs.copyFileSync(`src/frontend/${fileName}`, `dist/${fileName}`)
  )
}

export function getParserConfig(
  selectedConfigOption: string,
  excelData: { productCodes: string[]; productUrls: string[] }
) {
  switch (selectedConfigOption) {
    case ParserConfigType.charmante:
      return { ...charmanteParserConfig, ...excelData }

    case ParserConfigType.rusteaco:
      return { ...rusteacoParserConfig, ...excelData }

    default:
      return undefined
  }
}
