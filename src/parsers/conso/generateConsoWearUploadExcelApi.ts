import { generateUploadExcelApi } from "../../utils/generateUploadExcelApi"
import { consoParserConfig } from "./parserConfig"
import {
  ConsoWearArchivePricesExcelRow,
  ConsoWearSingleSizeExcelRow,
} from "./types"
import { getConsoWearMultipleSizesExcelRowData, parseConsoWear } from "./utils"
import { Express } from "express"

export function generateConsoWearUploadExcelApi(
  app: Express,
  rootDirName: string
) {
  return generateUploadExcelApi<
    ConsoWearSingleSizeExcelRow,
    ConsoWearArchivePricesExcelRow
  >({
    app,
    rootDirName,
    endPoint: "/upload-consowear",
    folderName: consoParserConfig.folderName,
    callback: ({ form: formJsonData, prices: pricesJsonData }, req, res) => {
      parseConsoWear({
        data: getConsoWearMultipleSizesExcelRowData(formJsonData),
        imagesHostingUrl: consoParserConfig.imagesHostingUrl,
        archivePrices: pricesJsonData,
      })
    },
  })
}
