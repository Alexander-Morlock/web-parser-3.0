import xlsx from "xlsx"
import multer from "multer"
import { Express, Response, Request } from "express"

type ParsedQs = {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
}

type GenerateUploadExcelApiProps<T> = {
  app: Express
  endPoint: string
  callback: (
    jsonData: T[],
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

export function generateUploadExcelApi<T>({
  app,
  endPoint,
  callback,
}: GenerateUploadExcelApiProps<T>) {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage })
  app.post(endPoint, upload.single("file"), (req, res) => {
    try {
      const workbook = xlsx.read(req.file?.buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData: T[] = xlsx.utils.sheet_to_json(sheet)
      callback(jsonData, req, res)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: "Failed to process the uploaded file" })
    }
  })
}
