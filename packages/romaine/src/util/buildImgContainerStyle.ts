import { CalculatedDimensions } from ".";

export const buildImgContainerStyle = (previewDims: CalculatedDimensions) => ({
  width: previewDims.width,
  height: previewDims.height,
});
