import {
  ImageParserConfig,
  ParserConfig,
  TextParserConfig,
} from "../utils/types"

const previewImagesParser: ImageParserConfig<HTMLAnchorElement> = {
  selector: "a.MagicThumb-swap",
  source: "href",
  maxNumberOfImages: 3,
}

const materialsTextParser: TextParserConfig = {
  name: "Состав",
  selector: "#short_description_block > div:first-child",
}

const colorsTextParser: TextParserConfig = {
  name: "Доступные цвета",
  selector: "#short_description_block > div:nth-child(2)",
}

const sizesTextParser: TextParserConfig = {
  name: "Доступные размеры",
  selector: "#short_description_block > div:nth-child(3)",
}

const descriptionTextParser: TextParserConfig = {
  name: "Описание",
  selector: "#description_full",
}

export const charmanteParserConfig: ParserConfig = {
  domainName: "https://opt.consowear.ru/",
  folderName: "charmante",
  productCodes: [],
  productUrls: [],
  imageParsers: [previewImagesParser],
  textParsers: [
    materialsTextParser,
    colorsTextParser,
    sizesTextParser,
    descriptionTextParser,
  ],
}
