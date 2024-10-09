import { ImageParserConfig, ParserConfig } from "../../utils/types"

export const consoPreviewImagesParser: ImageParserConfig<HTMLAnchorElement> = {
  selector: "ul.active a.MagicThumb-swap",
  source: "href",
  maxNumberOfImages: 3,
}

export const consoParserConfig: ParserConfig = {
  domainName: "https://opt.consowear.ru/",
  folderName: "consowear",
  requestDelay: 200,
  imageParsers: [consoPreviewImagesParser],
}
