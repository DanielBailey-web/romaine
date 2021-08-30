export type ShowPreview = (
  resizeRatio?: number,
  source?: any,
  cleanup?: boolean
) => void;

export type SetPreviewPaneDimensions = (dims?: {
  height: number;
  width: number;
}) => number | undefined;
