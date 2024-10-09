import {
  ImageParserConfig,
  ParserConfig,
  TextParserConfig,
} from "../utils/types"

const DOMAIN_NAME = "https://www.rusteaco.ru/"

const mainImagesParser: ImageParserConfig<HTMLImageElement> = {
  selector: ".product-image img.main-picture",
  source: "src",
}

const titleTextParser: TextParserConfig = {
  name: "Название",
  selector: ".product-desc > h1",
}

const descriptionTextParser: TextParserConfig = {
  name: "Описание",
  selector: "ul#tabs > li:first-child",
}

export const rusteacoParserConfig: ParserConfig = {
  domainName: DOMAIN_NAME,
  folderName: "rusteaco",
  productCodes: [],
  productUrls: [],
  imageParsers: [mainImagesParser],
  textParsers: [titleTextParser, descriptionTextParser],
}
