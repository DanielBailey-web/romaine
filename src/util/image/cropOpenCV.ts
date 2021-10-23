import { ContourCoordinates, OpenCV } from "../../components";
/**
 * perspective cropping utility (AKA keystone correction)
 * @param cv openCv
 * @param docCanvas
 * @param cropPoints
 * @param imageResizeRatio
 * @param setPreviewPaneDimensions
 */
export const cropOpenCV = (
  cv: OpenCV,
  docCanvas: HTMLCanvasElement,
  cropPoints: ContourCoordinates,
  imageResizeRatio: number
): void => {
  const dst = cv.imread(docCanvas);

  //   const bR = cropPoints["right-bottom"];
  const bL = cropPoints["left-bottom"];
  const tR = cropPoints["right-top"];
  const tL = cropPoints["left-top"];

  const l = tL.x / imageResizeRatio;
  const t = tL.y / imageResizeRatio;
  const r = tR.x / imageResizeRatio;
  const b = bL.y / imageResizeRatio;

  const M = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, -l, 0, 1, -t]);
  //   let dsize = new cv.Size(dst.rows - t - b, dst.cols - l - r);
  //   const dsize = new cv.Size(dst.rows - l - r, dst.cols - t - b);
  const dsize = new cv.Size(
    dst.cols - l - (dst.cols - r),
    dst.rows - t - (dst.rows - b)
  );

  cv.warpAffine(
    dst,
    dst,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );
  cv.imshow(docCanvas, dst);
  dst.delete();
  M.delete();
};
