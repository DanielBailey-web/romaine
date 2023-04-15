import type { ContourCoordinates } from ".";
import type { RomaineModes } from "../util";

export interface RomaineRef {
  getBlob?: (options: Partial<ImageExportOptions>) => Promise<Blob | null>;
  getDataURL?: (options: Partial<ImageExportOptions>) => Promise<string>;
  crop?: () => Promise<void>;
  /**
   * flips the image horizontally or vertically
   */
  flip?: (orientation: "horizontal" | "vertical") => Promise<void>;
}

export type CropFunc = (options?: Partial<ClickCropOptions>) => Promise<void>;

interface ClickCropOptions {
  preview: boolean;
  filterCvParams: Partial<OpenCVFilterProps>;
  image: Partial<ImageExportOptions>;
  cropPoints: ContourCoordinates;
  imageResizeRatio: number;
  mode: RomaineModes;
}
interface OpenCVFilterProps {
  blur: boolean;
  th: boolean;
  thMode: any;
  thMeanCorrection: number;
  thBlockSize: number;
  thMax: number;
  grayScale: boolean;
}

export interface ImageExportOptions {
  /**A DOMString indicating the image format. The default type is image/png; that type is also used if the given type isn't supported.
   * @external https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
   */
  type: "image/png" | "image/jpeg" | "image/webp" | "keep-same";
  /**A Number between 0 and 1, indicating image quality if the requested type is image/jpeg or image/webp. If this argument is anything else, the default values 0.92 and 0.80 are used for image/jpeg and image/webp respectively. Other arguments are ignored.
   *
   * This argument is used when creating images using lossy compression (such as image/jpeg), to specify the quality of the output.
   *
   * @external https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
   */
  quality: number;
}
