import fs from "fs"
import https from "https"
import { ExctractUrlsFromBackup } from "./types"

const PATH_PREFIX = "parsed/"
export const URLS_BACKUP_FILENAME = "urls-backup.txt"

export function createFolder(folderName: string, subfolder: string) {
  try {
    if (!fs.existsSync(PATH_PREFIX)) {
      fs.mkdirSync(PATH_PREFIX)
    }

    const path = `${PATH_PREFIX}${folderName}`
    const subfolderPath = `${path}/${subfolder}`

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }

    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath)
    }
  } catch (err) {
    console.error(err)
  }
}

export function delay(delayTimeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayTimeMs))
}

export function downloadImage(path: string, imageUrl: string) {
  const file = fs.createWriteStream(path)

  return new Promise((resolve, reject) => {
    https
      .get(imageUrl, (response) => {
        response.pipe(file)

        file.on("finish", () => {
          file.close()
          console.log(`Image downloaded as ${path}`)
          resolve(true)
        })
      })
      .on("error", (err) => {
        fs.unlink(path, () =>
          console.error(`Error downloading image: ${err.message}`)
        )
        reject(false)
      })
  })
}

export function saveTexts(
  fileName: string,
  folderName: string,
  data: string,
  enableConsoleMessage = true
) {
  return new Promise((resolve) => {
    fs.writeFile(`${PATH_PREFIX}${folderName}/${fileName}`, data, (err) => {
      if (err) {
        return console.log(err)
      }
      enableConsoleMessage && console.log(`${fileName} was saved!`)
      resolve(true)
    })
  })
}

export function replaceSlashesWithAmpersands(str: string) {
  return str.replace(/\/+/g, "&")
}

export function generateImagePath(
  folderName: string,
  productCode: string,
  index: number
) {
  const fileName = replaceSlashesWithAmpersands(productCode)
  const postFix = index ? `_${index}` : ""
  const path = `${PATH_PREFIX}${folderName}/images/${fileName}${postFix}.jpg`

  return path
}

export function copyFrontendToDistr() {
  const fileNames = fs.readdirSync("src/frontend")
  fileNames.forEach((fileName) =>
    fs.copyFileSync(`src/frontend/${fileName}`, `dist/${fileName}`)
  )
}

export function roundNumberBy(number: number, base: number) {
  const safeBase = Math.ceil(Math.abs(base))
  return safeBase * Math.ceil(number / safeBase)
}

export function getProgress(currentStep: number, steps: number) {
  return `Progress: [${Math.round((currentStep / steps) * 100)}%]`
}

export function exctractUrlsFromBackup(folderName: string) {
  return new Promise<ExctractUrlsFromBackup>((resolve, reject) => {
    const urlsBackupPath = `parsed/${folderName}/html/${URLS_BACKUP_FILENAME}`
    try {
      if (!fs.existsSync(urlsBackupPath)) {
        return resolve({})
      }

      fs.readFile(urlsBackupPath, (err, data) => {
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
      })
    } catch (error) {
      console.log(error)
    }
  })
}
