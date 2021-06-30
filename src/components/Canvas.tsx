import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const {
    cv,
    romaine: { mode },
  } = useRomaine();

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
            ctx.fillStyle = "#fff0";
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
      style={{
        position: "relative",
        ...(previewDims && buildImgContainerStyle(previewDims)),
      }}
    >
      <canvas
        id="preview-canvas"
        style={{
          backgroundSize: "20px 20px",
          backgroundImage:
            "linear-gradient(to bottom, #0001 10px, #0003 10px),linear-gradient(to right, #0002 10px, #0004 10px),linear-gradient(to right, transparent 10px, #ffff 10px),linear-gradient(to bottom, #0004 10px, transparent 10px),linear-gradient(to bottom, #ffff 10px, #ffff 10px)",
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          bottom: 0,
          zIndex: 5,
          pointerEvents: "none",
        }}
        ref={previewCanvasRef}
        width={previewDims?.width || maxWidth}
        height={previewDims?.height || maxHeight}
      />
      {(mode === "crop" || mode === "perspective-crop") && !loading && (
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
  );
};

interface RomaineCanvas extends Omit<Omit<CanvasProps, "image">, "romaineRef"> {
  openCvPath?: string;
  children?: ReactNode;
  image: File | string | null;
  wrapperProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
}
/**
 * This function is to make sure the the user is using Romaine context
 *
 * Can also pass children that can be absolutely positioned
 */
export const Canvas = forwardRef(
  (
    { openCvPath, children, image, wrapperProps = {}, ...props }: RomaineCanvas,
    ref: React.ForwardedRef<RomaineRef>
  ) => (
    <Romaine openCvPath={openCvPath}>
      <div
        id="romaine-wrapper"
        {...wrapperProps}
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          padding: "0 250px 0 2em",
          width: props.maxWidth,
          height: props.maxHeight,
          marginLeft: "auto",
          marginRight: "auto",
          ...wrapperProps.style,
        }}
      >
        {children}
        {image && <CanvasActual image={image} {...props} romaineRef={ref} />}
      </div>
    </Romaine>
  )
);
