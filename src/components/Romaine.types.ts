import type { ContourCoordinates } from ".";
import type { RomaineModes } from "../util";

export interface RomaineRef {
  getBlob?: (options: Partial<ImageExportOptions>) => Promise<Blob | null>;
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
interface ImageExportOptions {
  type: "image/png" | "image/jpeg";
  quality: number;
}
