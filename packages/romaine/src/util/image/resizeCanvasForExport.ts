import { ImagePtr, OpenCV } from "../../types";

/**
 * If canvasPtr exceeds maxSize, resizes it into a temporary Mat using
 * cv.INTER_AREA (optimal for downscaling), imshows to the canvas, and
 * deletes the temp Mat. Otherwise imshows the original directly.
 *
 * Call this instead of cv.imshow when maxSize may be set.
 */
export function imshowWithMaxSize(
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr,
  maxSize?: { width: number; height: number }
): void {
  if (!maxSize || (src.cols <= maxSize.width && src.rows <= maxSize.height)) {
    cv.imshow(canvas, src);
    return;
  }

  const scale = Math.min(maxSize.width / src.cols, maxSize.height / src.rows);
  const targetW = Math.round(src.cols * scale);
  const targetH = Math.round(src.rows * scale);

  const dsize = new cv.Size(targetW, targetH);
  const tmp = src.clone();
  cv.resize(tmp, tmp, dsize, 0, 0, cv.INTER_AREA);
  cv.imshow(canvas, tmp);
  tmp.delete();
}
