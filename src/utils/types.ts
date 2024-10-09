import { AllHTMLAttributes } from "react"

export type ParserConfig = {
  domainName: string
  productCodes: string[]
  productUrls: string[]
  requestDelay?: number
  folderName: string
  imageParsers?: ImageParserConfig<HTMLElement>[]
  textParsers?: TextParserConfig[]
}

export type ImageParserConfig<T extends HTMLElement> = {
  selector: string
  source: keyof AllHTMLAttributes<T>
  maxNumberOfImages?: number
}

export type TextParserConfig = {
  name: string
  selector: string
}

export type ParsedExcelRow = {
  ART: string
  URL: string
}

export enum ParserConfigType {
  charmante = "charmante",
  rusteaco = "rusteaco",
}
