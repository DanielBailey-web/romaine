import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useRomaine } from "../../../hooks";
import T from "prop-types";

import {
  calcDims,
  CalculatedDimensions,
  readFile,
  isCrossOriginURL,
  applyFilter,
  transform,
} from "../../../util";

import { CropPoints } from "./CropPoints";
import { CropPointsDelimiters } from "./CropPointsDelimiters";
import { RomaineRef } from "../../Romaine.types";

const buildImgContainerStyle = (previewDims: CalculatedDimensions) => ({
  width: previewDims.width,
  height: previewDims.height,
});

const imageDimensions = { width: 0, height: 0 };
let imageResizeRatio: number;

export interface CoordinateXY {
  x: number;
  y: number;
}
export interface ContourCoordinates {
  "left-bottom": CoordinateXY;
  "left-top": CoordinateXY;
  "right-bottom": CoordinateXY;
  "right-top": CoordinateXY;
}
interface CropperState extends ContourCoordinates {
  loading: boolean;
}
export interface CanvasProps {
  image: File | string;
  onDragStop: (s: CropperState) => void;
  onChange: (s: CropperState) => void;
  pointSize: number;
  lineWidth: number;
  pointBgColor: string;
  pointBorder: string;
  lineColor: string;
  maxWidth: number;
  maxHeight: number;
}
interface cropperRef {
  cropperRef: React.ForwardedRef<RomaineRef>;
}

const Canvas = ({
  image,
  onDragStop,
  onChange,
  cropperRef,
  pointSize = 30,
  lineWidth,
  lineColor,
  maxWidth,
  maxHeight,
}: CanvasProps & cropperRef) => {
  const { loaded: cvLoaded, cv } = useRomaine();
  const canvasRef = useRef<HTMLCanvasElement>();
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>();
  const [cropPoints, setCropPoints] = useState<ContourCoordinates>();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("crop");

  useImperativeHandle(
    cropperRef,
    (): RomaineRef => ({
      backToCrop: () => {
        setMode("crop");
      },
      done: async (opts) => {
        return new Promise((resolve, reject) => {
          if (canvasRef.current && cropPoints) {
            setLoading(true);
            transform(
              cv,
              canvasRef.current,
              cropPoints,
              imageResizeRatio,
              setPreviewPaneDimensions
            );
            applyFilter(cv, canvasRef.current, opts.filterCvParams);
            if (opts.preview) {
              setMode("preview");
            }
            canvasRef.current.toBlob(
              (blob) => {
                // blob.name = image.name;
                resolve(blob);
                setLoading(false);
              },
              opts.image?.type ||
                (typeof image !== "string" ? image.type : "image/png"),
              opts.image?.quality || 1
            );
          } else return reject();
        });
      },
    })
  );
  useEffect(() => {
    if (mode === "preview") {
      showPreview();
    }
  }, [mode]);

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
            imageDimensions.width = canvasRef.current.width;
            imageDimensions.height = canvasRef.current.height;
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

  const showPreview = (image?: string) => {
    const src = image || cv.imread(canvasRef.current);
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

  const detectContours = () => {
    const dst = cv.imread(canvasRef.current);
    const ksize = new cv.Size(5, 5);
    // convert the image to grayscale, blur it, and find edges in the image
    cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(dst, dst, ksize, 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(dst, dst, 75, 200);
    // find contours
    cv.threshold(dst, dst, 120, 200, cv.THRESH_BINARY);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      dst,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );
    const rect = cv.boundingRect(dst);
    dst.delete();
    hierarchy.delete();
    contours.delete();
    // transform the rectangle into a set of points
    Object.keys(rect).forEach((key) => {
      rect[key] = rect[key] * imageResizeRatio;
    });

    const contourCoordinates = {
      "left-top": { x: rect.x, y: rect.y },
      "right-top": { x: rect.x + rect.width, y: rect.y },
      "right-bottom": {
        x: rect.x + rect.width,
        y: rect.y + rect.height,
      },
      "left-bottom": { x: rect.x, y: rect.y + rect.height },
    };

    setCropPoints(contourCoordinates);
  };

  const clearMagnifier = () => {
    if (magnifierCanvasRef.current) {
      const magnCtx = magnifierCanvasRef.current.getContext("2d");
      magnCtx &&
        magnCtx.clearRect(
          0,
          0,
          magnifierCanvasRef.current.width,
          magnifierCanvasRef.current.height
        );
    }
  };

  useEffect(() => {
    if (onChange && cropPoints) {
      onChange({ ...cropPoints, loading });
    }
  }, [cropPoints, loading]);

  useEffect(() => {
    const bootstrap = async () => {
      const src = await readFile(image);
      await createCanvas(src);
      showPreview();
      detectContours();
      setLoading(false);
    };

    if (image && previewCanvasRef.current && cvLoaded && mode === "crop") {
      bootstrap();
    } else {
      setLoading(true);
    }
  }, [image, previewCanvasRef.current, cvLoaded, mode]);

  const onDrag = useCallback((position, area) => {
    if (magnifierCanvasRef.current && previewCanvasRef.current) {
      const { x, y } = position;

      const magnCtx = magnifierCanvasRef.current.getContext("2d");
      clearMagnifier();

      // TODO we should make those 5, 10 and 20 values proportionate
      // to the point size
      magnCtx &&
        magnCtx.drawImage(
          previewCanvasRef.current,
          x - (pointSize - 10),
          y - (pointSize - 10),
          pointSize + 5,
          pointSize + 5,
          x + 10,
          y - 90,
          pointSize + 20,
          pointSize + 20
        );

      setCropPoints((cPs) => {
        if (cPs) return { ...cPs, [area]: { x, y } };
      });
    }
  }, []);

  const onStop = useCallback(
    (
      position: CoordinateXY,
      area: keyof ContourCoordinates,
      cropPoints: ContourCoordinates
    ) => {
      const { x, y } = position;

      clearMagnifier();
      setCropPoints((cPs) => {
        if (cPs) return { ...cPs, [area]: { x, y } };
      });
      if (onDragStop) {
        onDragStop({ ...cropPoints, [area]: { x, y }, loading });
      }
    },
    []
  );

  return (
    <div
      style={{
        position: "relative",
        ...(previewDims && buildImgContainerStyle(previewDims)),
      }}
    >
      {previewDims && mode === "crop" && cropPoints && (
        <>
          <CropPoints
            pointSize={pointSize}
            cropPoints={cropPoints}
            previewDims={previewDims}
            onDrag={onDrag}
            onStop={onStop}
            bounds={{
              left:
                (previewCanvasRef?.current?.offsetLeft || 0) - pointSize / 2,
              top: (previewCanvasRef?.current?.offsetTop || 0) - pointSize / 2,
              right:
                (previewCanvasRef?.current?.offsetLeft || 0) -
                pointSize / 2 +
                (previewCanvasRef?.current?.offsetWidth || 0),
              bottom:
                (previewCanvasRef?.current?.offsetTop || 0) -
                pointSize / 2 +
                (previewCanvasRef?.current?.offsetHeight || 0),
            }}
          />
          <CropPointsDelimiters
            previewDims={previewDims}
            cropPoints={cropPoints}
            lineWidth={lineWidth}
            lineColor={lineColor}
            pointSize={pointSize}
          />
          <canvas
            style={{
              position: "absolute",
              zIndex: 5,
              pointerEvents: "none",
            }}
            width={previewDims.width}
            height={previewDims.height}
            ref={magnifierCanvasRef}
          />
        </>
      )}
      <canvas
        style={{ zIndex: 5, pointerEvents: "none" }}
        ref={previewCanvasRef}
      />
    </div>
  );
};

export default Canvas;

Canvas.propTypes = {
  image: T.object.isRequired,
  onDragStop: T.func,
  onChange: T.func,
  cropperRef: T.shape({
    current: T.shape({
      done: T.func.isRequired,
      backToCrop: T.func.isRequired,
    }),
  }),
  pointSize: T.number,
  lineWidth: T.number,
  pointBgColor: T.string,
  pointBorder: T.string,
  lineColor: T.string,
};
