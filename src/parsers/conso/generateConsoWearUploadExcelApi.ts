import { generateUploadExcelApi } from "../../utils/generateUploadExcelApi"
import { getJsonDataFromExcelFile } from "../../utils/utils"
import { consoParserConfig } from "./parserConfig"
import {
  ConsoWearArchivePricesExcelRow,
  ConsoWearSingleSizeExcelRow,
} from "./types"
import { getConsoWearMultipleSizesExcelRowData, parseConsoWear } from "./utils"
import { Express } from "express"

enum ConsoFilednames {
  form = "form",
  archivePrices = "archivePrices",
}

export function generateConsoWearUploadExcelApi(
  app: Express,
  rootDirName: string
) {
  return generateUploadExcelApi({
    app,
    rootDirName,
    endPoint: "/upload-consowear",
    folderName: consoParserConfig.folderName,
    fieldnames: [ConsoFilednames.form, ConsoFilednames.archivePrices],
    callback: (files, req, res) => {
      const getFile = (fieldname: ConsoFilednames) =>
        files.find((file) => file.fieldname === fieldname)?.file

      const formJsonData =
        getJsonDataFromExcelFile<ConsoWearSingleSizeExcelRow>(
          getFile(ConsoFilednames.form)
        )

      const archivePrices =
        getJsonDataFromExcelFile<ConsoWearArchivePricesExcelRow>(
          getFile(ConsoFilednames.archivePrices)
        )

      formJsonData &&
        parseConsoWear({
          data: getConsoWearMultipleSizesExcelRowData(formJsonData),
          imagesHostingUrl: consoParserConfig.imagesHostingUrl,
          archivePrices,
        })
    },
  })
}
