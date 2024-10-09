import express from "express"
import multer from "multer"
import xlsx from "xlsx"
import path from "path"
import bodyParser from "body-parser"
import { copyFrontendToDistr, getParserConfig } from "./utils/utils"
import { parse } from "./utils/parse"
import { ParsedExcelRow, ParserConfigType } from "./utils/types"
import { charmanteParserConfig } from "./parserConfigs/charmante"
import { rusteacoParserConfig } from "./parserConfigs/rusteaco"

copyFrontendToDistr()

const app = express()
const PORT = process.env.PORT || 3000

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("dist"))

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")))

app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const workbook = xlsx.read(req.file?.buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData: ParsedExcelRow[] = xlsx.utils.sheet_to_json(sheet)

    res.sendFile(path.join(__dirname, "upload-succesfull.html"))

    const selectedConfigOption: string = req.body.config
    const productCodes = jsonData.map((row) => row.ART)
    const productUrls = jsonData.map((row) => row.URL)

    const config = getParserConfig(selectedConfigOption, {
      productCodes,
      productUrls,
    })

    config && parse(config)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to process the uploaded file" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
