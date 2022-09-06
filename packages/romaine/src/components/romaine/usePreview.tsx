import { MutableRefObject, useCallback, useRef, useState } from "react";
import { useRomaine } from "../../hooks";
import { SetPreviewPaneDimensions, ShowPreview } from "../../types";
import { calcDims, CalculatedDimensions } from "../../util";
interface Props {
  canvasRef: MutableRefObject<HTMLCanvasElement | undefined>;
  maxDims: {
    maxHeight: number;
    maxWidth: number;
  };
  originalImageDims: {
    width: number;
    height: number;
  };
}

export const usePreview = ({
  canvasRef,
  maxDims,
  originalImageDims,
}: Props) => {
  const { maxHeight, maxWidth } = maxDims;
  const { cv } = useRomaine();

  const previewRef = useRef<HTMLCanvasElement>(null);
  const [imageResizeRatio, setImageResizeRatio] = useState(1);
  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>({
    height: maxHeight,
    width: maxWidth,
    ratio: 1,
  });
  const createPreview: ShowPreview = (
    resizeRatio = imageResizeRatio,
    //@ts-ignore
    source = cv.imread(canvasRef.current),
    cleanup = true
  ) => {
    console.trace("creating preview");
    if (cv && previewRef.current) {
      // if (canvasRef.current) {
      //   createImageBitmap(canvasRef.current, {
      //     resizeHeight: ~~(source.rows * resizeRatio),
      //     resizeWidth: ~~(source.cols * resizeRatio),
      //   }).then((bitmap) => {
      //     previewRef.current?.getContext("2d")?.drawImage(bitmap, 0, 0);
      //   });
      // }
      console.log(previewRef.current);
      const dst = new cv.Mat();
      const dsize = new cv.Size(0, 0);
      cv.resize(source, dst, dsize, resizeRatio, resizeRatio, cv.INTER_AREA);
      cv.imshow(previewRef.current, dst);
      if (cleanup) source.delete();
      dst.delete();
    }
  };
  const setPreviewPaneDimensions: SetPreviewPaneDimensions = useCallback(
    (dims = originalImageDims) => {
      if (dims && previewRef?.current) {
        const newPreviewDims = calcDims(
          dims.width,
          dims.height,
          maxWidth,
          maxHeight
        );
        setPreviewDims(newPreviewDims);

        previewRef.current.width = newPreviewDims.width;
        previewRef.current.height = newPreviewDims.height;
        const irr = newPreviewDims.width / dims.width;

        setImageResizeRatio(irr);
        return irr;
      }
    },
    [maxHeight, maxWidth]
  );
  return {
    previewRef,
    createPreview,
    imageResizeRatio,
    setPreviewPaneDimensions,
    previewDims,
  };
};
