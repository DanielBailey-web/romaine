import { ImagePtr, size } from "./openCV";

export type ShowPreview = (
  resizeRatio?: number,
  source?: ImagePtr,
  cleanup?: boolean
) => void;

export type SetPreviewPaneDimensions = (dims?: size) => number | undefined;
