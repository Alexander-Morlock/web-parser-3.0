import { AllHTMLAttributes } from "react"
import { ResizeOptions } from "sharp"

export type ParserConfig = {
  domainName: string
  productCodes?: string[]
  productUrls?: (string | undefined)[]
  requestDelay?: number
  folderName: string
  imageParsers?: ImageParserConfig<HTMLElement>[]
  textParsers?: TextParserConfig[]
  resizeOptions?: ResizeOptions
  imagesHostingUrl: string
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

export type ExctractUrlsFromBackup = { [key: string]: string | undefined }
