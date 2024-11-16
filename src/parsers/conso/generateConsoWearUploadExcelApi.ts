import { generateUploadExcelApi } from "../../utils/generateUploadExcelApi"
import { createFolder } from "../../utils/utils"
import {
  ConsoWearSingleSizeExcelRow,
  ConsoWearMultipleSizesExcelRow,
} from "./types"
import { parseConsoWear } from "./utils"
import { Express } from "express"
import path from "path"

export function generateConsoWearUploadExcelApi(
  app: Express,
  rootDirName: string
) {
  return generateUploadExcelApi<ConsoWearSingleSizeExcelRow>({
    app,
    endPoint: "/upload-consowear",
    callback: (jsonData, req, res) => {
      createFolder("consowear", "html")
      createFolder("consowear", "images")

      res.sendFile(path.join(rootDirName, "upload-succesfull.html"))

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
              PRICE,
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
