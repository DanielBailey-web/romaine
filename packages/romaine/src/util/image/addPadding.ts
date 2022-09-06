import { AddPadding } from "../../types/AddPadding";

/**
 * Function that adds transparent (or whatever the fill color is) to the image canvas
 * @see https://stackoverflow.com/questions/43391205/add-padding-to-images-to-get-them-into-the-same-shape#43391469
 * @example
 * addPadding(cv, canvasRef.current, { left: 500 }, { setPreviewPaneDimensions, showPreview });
 */
export const addPadding: AddPadding = (
  cv,
  src,
  { top = 0, bottom = 0, left = 0, right = 0 },
  { showPreview, setPreviewPaneDimensions }
) => {
  const dst = new cv.Mat();
  // @ts-ignore
  cv.copyMakeBorder(
    cv.imread(src),
    dst,
    top,
    bottom,
    left,
    right,
    cv.BORDER_CONSTANT
  );

  setPreviewPaneDimensions({
    width: src.width + left + right,
    height: src.height + top + bottom,
  });
  cv.imshow(src, dst);
  showPreview();
  dst.delete();
};
