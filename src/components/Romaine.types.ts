export interface RomaineRef {
  backToCrop?: () => void;
  /**
   * function that does the transforming, filtering, and optionally shows a preview
   */
  crop?: (options: Partial<ClickCropOptions>) => void;
  getBlob?: (options: Partial<ImageExportOptions>) => Promise<Blob | null>;
}

export type DoneFunc = (options: Partial<ClickCropOptions>) => Promise<Blob>;

interface ClickCropOptions {
  preview: boolean;
  filterCvParams: Partial<OpenCVFilterProps>;
  image: Partial<ImageExportOptions>;
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
