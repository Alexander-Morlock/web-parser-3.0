import { generateUploadExcelApi } from "../../utils/generateUploadExcelApi"
import { roundNumberBy } from "../../utils/utils"
import { consoParserConfig } from "./parserConfig"
import {
  ConsoWearSingleSizeExcelRow,
  ConsoWearMultipleSizesExcelRow,
} from "./types"
import { parseConsoWear } from "./utils"
import { Express } from "express"

export function generateConsoWearUploadExcelApi(
  app: Express,
  rootDirName: string
) {
  return generateUploadExcelApi<ConsoWearSingleSizeExcelRow>({
    app,
    rootDirName,
    endPoint: "/upload-consowear",
    folderName: consoParserConfig.folderName,
    callback: (jsonData, req, res) => {
      const products: {
        [key: string]: ConsoWearMultipleSizesExcelRow
      } = {}

      jsonData.forEach(
        (
          { ART, SUBART, SIZE, PRICE, MATERIALS, COLOR, DESCRIPTION },
          INDEX
        ) => {
          if (ART in products) {
            products[ART].SIZES = [...products[ART].SIZES, SIZE].sort()
          } else {
            products[ART] = {
              ART,
              SUBART,
              SIZES: [SIZE],
              PRICE: String(roundNumberBy(Number(PRICE), 10)),
              MATERIALS,
              COLOR,
              DESCRIPTION,
              INDEX,
            }
          }
        }
      )

      const data: ConsoWearMultipleSizesExcelRow[] = Object.entries(products)
        .map(([ART, product]) => ({ ...product, ART }))
        .sort((a, b) => a.INDEX - b.INDEX)

      parseConsoWear({
        data,
        imagesHostingUrl: "http://onlinemania.ru/consowear",
      })
    },
  })
}
