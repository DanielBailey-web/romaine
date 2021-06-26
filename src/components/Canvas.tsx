import React, { forwardRef, useEffect, useRef, useState } from "react";
import { CropperProps, CroppingCanvas } from "./Cropper";
import {
  calcDims,
  CalculatedDimensions,
  isCrossOriginURL,
  readFile,
} from "../util";
import { buildImgContainerStyle } from "../util/buildImgContainerStyle";
import { Romaine } from "./Romaine";
import { RomaineRef } from "./Romaine.types";
import { useRomaine } from "../hooks";

interface CanvasProps extends CropperProps {
  cropper?: boolean;
}
let imageResizeRatio = 1;
const CanvasActual = ({ cropper = true, ...props }: CanvasProps) => {
  const { cv } = useRomaine();
  const { maxHeight, maxWidth, image } = props;

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  let canvasRef = useRef<HTMLCanvasElement>();
  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>();
  const [loading, setLoading] = useState(true);

  const setPreviewPaneDimensions = () => {
    if (canvasRef?.current && previewCanvasRef?.current) {
      // set preview pane dimensions
      const newPreviewDims = calcDims(
        canvasRef.current.width,
        canvasRef.current.height,
        maxWidth,
        maxHeight
      );
      setPreviewDims(newPreviewDims);

      previewCanvasRef.current.width = newPreviewDims.width;
      previewCanvasRef.current.height = newPreviewDims.height;

      imageResizeRatio = newPreviewDims.width / canvasRef.current.width;
    }
  };

  const showPreview = (imageResizeRatio: number, _image?: string) => {
    const src = cv.imread(canvasRef.current);
    const dst = new cv.Mat();
    const dsize = new cv.Size(0, 0);
    console.log(src, dst, dsize, imageResizeRatio);
    cv.resize(
      src,
      dst,
      dsize,
      imageResizeRatio,
      imageResizeRatio,
      cv.INTER_AREA
    );
    cv.imshow(previewCanvasRef.current, dst);
    src.delete();
    dst.delete();
  };

  const createCanvas = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const img = document.createElement("img");
        img.onload = async () => {
          // set edited image canvas and dimensions
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            setPreviewPaneDimensions();
            return resolve();
          }
          return reject();
        };
        if (isCrossOriginURL(src)) img.crossOrigin = "use-credentials";
        img.src = src;
      } catch (err) {
        reject();
      }
    });
  };

  useEffect(() => {
    setLoading(true);
    readFile(image).then(async (res) => {
      await createCanvas(res);
      showPreview(imageResizeRatio);
      setLoading(false);
    });
  }, [cv, image]);

  return (
    <div
      id="romaine-wrapper"
      style={{
        display: "grid",
        placeItems: "center",
        padding: "4em",
      }}
    >
      <div
        style={{
          position: "relative",
          ...(previewDims && buildImgContainerStyle(previewDims)),
        }}
      >
        <canvas
          id="preview-canvas"
          style={{ position: "absolute", zIndex: 5, pointerEvents: "none" }}
          ref={previewCanvasRef}
          width={previewDims?.width || maxWidth}
          height={previewDims?.height || maxHeight}
        />
        {cropper && !loading && (
          <CroppingCanvas
            imageResizeRatio={imageResizeRatio}
            setPreviewPaneDimensions={setPreviewPaneDimensions}
            createCanvas={createCanvas}
            showPreview={showPreview}
            canvasRef={canvasRef}
            previewCanvasRef={previewCanvasRef}
            previewDims={previewDims}
            setPreviewDims={setPreviewDims}
            {...props}
          />
        )}
      </div>
    </div>
  );
};

interface RomaineCanvas extends Omit<CanvasProps, "romaineRef"> {
  openCvPath?: string;
}
/**
 * This function is to make sure the the user is using Romaine context
 * @param param0
 * @returns
 */
export const Canvas = forwardRef(
  (
    { openCvPath, ...props }: RomaineCanvas,
    ref: React.ForwardedRef<RomaineRef>
  ) => (
    <Romaine openCvPath={openCvPath}>
      <CanvasActual {...props} romaineRef={ref} />
    </Romaine>
  )
);
