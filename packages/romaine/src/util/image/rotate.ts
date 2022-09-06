import { OpenCV } from "../../types/openCV";
import { SetPreviewPaneDimensions, ShowPreview } from "../../types";
import { RomaineModes } from "../reducers";
interface RotateOptions {
  preview?: boolean;
  angle: number;
  cleanup?: boolean;
}

export const rotate = async (
  cv: OpenCV,
  canvas: HTMLCanvasElement | null,
  mode: RomaineModes,
  setPreviewPaneDimensions: SetPreviewPaneDimensions,
  showPreview: ShowPreview,
  opts: RotateOptions,
  cvCanvas?: any
) => {
  const { preview, angle, cleanup } = {
    preview: false,
    cleanup: true,
    ...opts,
  };
  let src = cvCanvas;
  if (!canvas) return;
  if (!cvCanvas) src = cv.imread(canvas);
  // const dst = new cv.Mat();
  const center = new cv.Point(src.cols / 2, src.rows / 2);

  const M1_temp = cv.getRotationMatrix2D(center, angle, 1);
  const a = [...M1_temp.data64F];
  M1_temp.delete();

  const cos = Math.abs(a[0]);
  const sin = Math.abs(a[3]);

  // compute the new bounding dimensions of the image
  const newWidth = ~~(src.rows * sin + src.cols * cos);
  const newHeight = ~~(src.rows * cos + src.cols * sin);

  /**
   * Col 3 Row 1 is horizontal transform (numerical position away from y axis)
   *
   * Col 3 Row 2 is vertical transform ("" y axis)
   *
   * @description
   * This code is a modified version of rotate_bound found in python package imutils
   * @link
   * https://github.com/jrosebr1/imutils/blob/c12f15391fcc945d0d644b85194b8c044a392e0a/imutils/convenience.py#L41
   */
  const M1 = [
    [a[0], a[1], a[2] + newWidth / 2 - center.x],
    [a[3], a[4], a[5] + newHeight / 2 - center.y],
  ];

  const oneDimensionalArray = ([] as number[]).concat.apply([], M1);
  const M = cv.matFromArray(2, 3, cv.CV_64FC1, oneDimensionalArray);

  const height: number = newHeight,
    width: number = newWidth;

  canvas.height = height;
  canvas.width = width;

  const irr = setPreviewPaneDimensions({
    height,
    width,
  });
  console.log({ irr });

  // this is the slowest step
  cv.warpAffine(
    src,
    src,
    M,
    { height, width },
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );

  // if (mode !== "undo" && mode !== "redo") {
  //   showPreview(irr, dst, false);
  //   setMode?.(null);
  // }
  // setTimeout(() => {
  //   cv.imshow(canvas, dst);
  //   dst.delete();
  // }, 0);

  if (mode !== "undo" && mode !== "redo") showPreview(irr, src, false);
  setTimeout(() => {
    // show the real preview first so it works faster for user
    // due to this we must cleanup dst ourselves
    // imshow is being called in showPreview, so for preview this would be redundant
    if (!preview) cv.imshow(canvas, src);
    if (cleanup) {
      console.log("delete the src");
      src.delete();
    }
    // finished, set the mode back to null
    M.delete();
  }, 0);
};
