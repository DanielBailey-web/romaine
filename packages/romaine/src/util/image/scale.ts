import { ImagePtr, OpenCV } from "../../types";

export const scale = async (
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr,
  dims: {
    width: number;
    height: number;
  }
) => {
  const dsize = new cv.Size(dims.width, dims.height);
  cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow(canvas, src);
};
