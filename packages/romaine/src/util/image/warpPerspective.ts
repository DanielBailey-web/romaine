import { ContourCoordinates } from "../../components";
import { ImagePtr, OpenCV } from "../../types";
/**
 * perspective cropping utility (AKA keystone correction)
 * @param cv openCv
 * @param src The source image pointer
 * @param cropPoints
 * @param imageResizeRatio
 */
export const warpPerspective = (
  cv: OpenCV,
  src: ImagePtr,
  cropPoints: ContourCoordinates,
  imageResizeRatio: number
): void => {
  // const src = cv.imread(docCanvas);
  const bR = cropPoints["right-bottom"];
  const bL = cropPoints["left-bottom"];
  const tR = cropPoints["right-top"];
  const tL = cropPoints["left-top"];

  // create source coordinates matrix
  const sourceCoordinates = [tL, tR, bR, bL].map((point) => [
    point.x / imageResizeRatio,
    point.y / imageResizeRatio,
  ]);

  // get max width
  const maxWidth = Math.max(bR.x - bL.x, tR.x - tL.x) / imageResizeRatio;
  // get max height
  const maxHeight = Math.max(bL.y - tL.y, bR.y - tR.y) / imageResizeRatio;

  // create dest coordinates matrix
  const destCoordinates = [
    [0, 0],
    [maxWidth - 1, 0],
    [maxWidth - 1, maxHeight - 1],
    [0, maxHeight - 1],
  ];

  // convert to open cv matrix objects
  const Ms = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    ([] as number[]).concat(...sourceCoordinates)
  );
  const Md = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    ([] as number[]).concat(...destCoordinates)
  );
  const transformMatrix = cv.getPerspectiveTransform(Ms, Md);
  // set new image size
  const dsize = new cv.Size(maxWidth, maxHeight);
  // perform warp
  cv.warpPerspective(
    src,
    src,
    transformMatrix,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );
  // cv.imshow(docCanvas, src);

  // src.delete();
  Ms.delete();
  Md.delete();
  transformMatrix.delete();
};
