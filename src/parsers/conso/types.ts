export type ConsoWearSingleSizeExcelRow = {
  ART: string
  SUBART: string
  SIZE: string
  PRICE: string
  MATERIALS: string
  COLOR: string
  DESCRIPTION: string
}

export type ConsoWearMultipleSizesExcelRow = Omit<
  ConsoWearSingleSizeExcelRow,
  "SIZE"
> & {
  SIZES: string[]
  INDEX: number
}
