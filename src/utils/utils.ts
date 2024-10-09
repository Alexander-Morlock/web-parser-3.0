import fs from "fs"
import https from "https"

const PATH_PREFIX = "parsed/"

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

export function saveTexts(fileName: string, folderName: string, data: string) {
  return new Promise((resolve) => {
    fs.writeFile(`${PATH_PREFIX}${folderName}/${fileName}`, data, (err) => {
      if (err) {
        return console.log(err)
      }
      console.log(`${fileName} was saved!`)
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
