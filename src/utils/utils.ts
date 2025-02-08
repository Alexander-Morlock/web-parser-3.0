import fs from "fs"
import xlsx from "xlsx"
import https from "https"
import { ExctractUrlsFromBackup } from "./types"
import sharp, { ResizeOptions } from "sharp"

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

type DownloadImageProps = {
  path: string
  fileName: string
  sourceImageUrl: string
  resizeOptions?: ResizeOptions
}

export function downloadImage({
  path,
  fileName,
  sourceImageUrl,
  resizeOptions,
}: DownloadImageProps) {
  const getFullPath = (config?: { postfix: string }) =>
    `${path}${fileName}${config?.postfix ?? ""}.jpg`

  const largeFilePath = getFullPath({ postfix: "_enl" })
  const smallFilePath = getFullPath()

  if (fs.existsSync(largeFilePath)) {
    console.log("Image is already downloaded", largeFilePath)
    return Promise.resolve()
  }

  const fileLarge = fs.createWriteStream(largeFilePath)

  return new Promise((resolve, reject) => {
    https
      .get(sourceImageUrl, (response) => {
        response.pipe(fileLarge)

        fileLarge.on("finish", () => {
          fileLarge.close()
          console.log(`Image downloaded as ${fileName}`)

          if (!resizeOptions) {
            return resolve(true)
          }

          // resizing
          fs.readFile(largeFilePath, async (err, buffer) => {
            if (err) {
              return reject(err)
            }

            sharp(buffer)
              .resize(resizeOptions)
              .toFile(smallFilePath)
              .then(() => resolve(true))
              .catch(() => reject(err))
          })
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
  index = 0
) {
  const postFix = index ? `_${index}` : ""
  const path = `${PATH_PREFIX}${folderName}/images/`
  const fileName = `${replaceSlashesWithAmpersands(productCode)}${postFix}`

  return { path, fileName }
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

export function getUrlFromWebfolder(
  filenames: string[],
  imagesHostingUrl: string,
  onSuccess: () => void
) {
  return new Promise<string | undefined>(async (resolve, reject) => {
    for (const filename of filenames) {
      const url = new URL(`${imagesHostingUrl}/${filename}`).href

      try {
        const response = await fetch(url)
        if (response.status === 200) {
          onSuccess()
          return resolve(url)
        }

        resolve(undefined)
      } catch (error) {
        reject(error)
      }
    }
  })
}

export function getJsonDataFromExcelFile<T>(file?: Express.Multer.File) {
  if (!file) {
    return undefined
  }

  const workbook = xlsx.read(file.buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData: T[] = xlsx.utils.sheet_to_json(sheet)

  return jsonData
}

export function getIsNotNullableTypeGuard<T>(value?: T | null): value is T {
  return value !== null && value !== undefined
}
