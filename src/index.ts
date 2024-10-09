import express from "express"
import path from "path"
import bodyParser from "body-parser"
import { copyFrontendToDistr } from "./utils/utils"
import { generateConsoWearUploadExcelApi } from "./parsers/conso/generateConsoWearUploadExcelApi"

copyFrontendToDistr()

const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("dist"))

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")))

generateConsoWearUploadExcelApi(app)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
