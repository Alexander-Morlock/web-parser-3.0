import multer from "multer"
import { Express, Response, Request } from "express"
import { createFolder, getIsNotNullableTypeGuard } from "./utils"
import path from "path"

type ParsedQs = {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
}

type GenerateUploadExcelApiProps = {
  app: Express
  endPoint: string
  folderName: string
  rootDirName: string
  fieldnames: string[]
  callback: (
    files: {
      fieldname: string
      file?: Express.Multer.File
    }[],
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

export function generateUploadExcelApi({
  app,
  endPoint,
  folderName,
  rootDirName,
  fieldnames,
  callback,
}: GenerateUploadExcelApiProps) {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage })
  app.post(
    endPoint,
    upload.fields(fieldnames.map((fieldname) => ({ name: fieldname }))),
    (req, res) => {
      try {
        const files = fieldnames
          .map((fieldname) => ({
            fieldname,
            file: getFile(req.files, fieldname),
          }))
          .filter(getIsNotNullableTypeGuard)

        createFolder(folderName, "html")
        createFolder(folderName, "images")

        res.sendFile(path.join(rootDirName, "upload-succesfull.html"))

        callback(files, req, res)
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
