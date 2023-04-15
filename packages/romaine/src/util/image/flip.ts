import { ImagePtr, OpenCV } from "../../types";

export const flip = async (
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr,
  orientation: "horizontal" | "vertical"
) => {
  if (orientation === "horizontal") {
    cv.flip(src, src, 1);
  } else if (orientation === "vertical") {
    cv.flip(src, src, 0);
  } else {
    throw new Error("Invalid orientation");
  }
  cv.imshow(canvas, src);
};
