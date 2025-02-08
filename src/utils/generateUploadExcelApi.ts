import xlsx from "xlsx"
import multer from "multer"
import { Express, Response, Request } from "express"
import { createFolder } from "./utils"
import path from "path"

type ParsedQs = {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
}

type GenerateUploadExcelApiProps<TForm, TArchivePrices> = {
  app: Express
  endPoint: string
  folderName: string
  rootDirName: string
  callback: (
    jsonData: {
      form: TForm[]
      prices?: TArchivePrices[]
    },
    req: Request<
      { [key: string]: string },
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: Response
  ) => void
}

type ReqFiles =
  | {
      [fieldname: string]: Express.Multer.File[]
    }
  | Express.Multer.File[]

export function generateUploadExcelApi<TForm, TArchivePrices>({
  app,
  endPoint,
  folderName,
  rootDirName,
  callback,
}: GenerateUploadExcelApiProps<TForm, TArchivePrices>) {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage })
  app.post(
    endPoint,
    upload.fields([{ name: "form" }, { name: "archivePrices" }]),
    (req, res) => {
      try {
        const formFile = getFile(req.files, "form")
        const archivePricesFile = getFile(req.files, "archivePrices")

        const formJsonData = getJsonDataFromExcelFile<TForm>(formFile)
        const archivePricesJsonData =
          getJsonDataFromExcelFile<TArchivePrices>(archivePricesFile)

        createFolder(folderName, "html")
        createFolder(folderName, "images")

        res.sendFile(path.join(rootDirName, "upload-succesfull.html"))

        formJsonData &&
          callback(
            { form: formJsonData, prices: archivePricesJsonData },
            req,
            res
          )
      } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to process the uploaded file" })
      }
    }
  )
}

function getFile(files?: ReqFiles, fieldname?: string) {
  if (!files || !fieldname) {
    return undefined
  }

  return Array.isArray(files) ? undefined : files[`${fieldname}`]?.[0]
}

function getJsonDataFromExcelFile<T>(file?: Express.Multer.File) {
  if (!file) {
    return undefined
  }

  const workbook = xlsx.read(file.buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData: T[] = xlsx.utils.sheet_to_json(sheet)

  return jsonData
}
