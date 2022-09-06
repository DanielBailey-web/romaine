import { OpenCV } from "../../../types";

interface Filter {
  shape: number[];
  values: number[];
}
export const createFilterMat = (cv: OpenCV, filter: Readonly<Filter>) => {
  return cv.matFromArray(
    filter.shape[0],
    filter.shape[1],
    cv.CV_32FC1,
    filter.values
  );
};
