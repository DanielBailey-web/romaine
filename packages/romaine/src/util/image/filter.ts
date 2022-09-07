import { OpenCV, OpenCVFilterProps } from "../../types";
// https://amin-ahmadi.com/2016/03/24/sepia-filter-opencv/
export const applyFilter = async (
  cv: OpenCV,
  docCanvas: HTMLCanvasElement,
  filterCvParams: Partial<OpenCVFilterProps> = {}
) => {
  // default options
  const options = {
    blur: false,
    th: true,
    thMode: cv.ADAPTIVE_THRESH_MEAN_C,
    thMeanCorrection: 15,
    thBlockSize: 25,
    thMax: 255,
    grayScale: true,
    ...filterCvParams,
  };
  const dst = cv.imread(docCanvas);

  if (options.grayScale) {
    cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
  }
  if (options.blur) {
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
  }
  if (options.th) {
    if (options.grayScale) {
      cv.adaptiveThreshold(
        dst,
        dst,
        options.thMax,
        options.thMode,
        cv.THRESH_BINARY,
        options.thBlockSize,
        options.thMeanCorrection
      );
    } else {
      //@ts-ignore need to fix this type error (add to OpenCV type)
      dst.convertTo(dst, -1, 1, 60);
      cv.threshold(dst, dst, 170, 255, cv.THRESH_BINARY);
    }
  }
  cv.imshow(docCanvas, dst);
};
