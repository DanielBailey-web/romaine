import React, {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useRomaine } from "../../hooks";
import T from "prop-types";

import {
  CalculatedDimensions,
  // readFile,
  // isCrossOriginURL,
  applyFilter,
  warpPerspective,
} from "../../util";

import { CropPoints } from "./CropPoints";
import { CropPointsDelimiters } from "./CropPointsDelimiters";
import { ContourCoordinates, CoordinateXY } from ".";
import { RomaineRef } from "../Romaine.types";

// const imageDimensions = { width: 0, height: 0 };

interface CropperState extends ContourCoordinates {
  loading: boolean;
}
export interface CropperProps {
  romaineRef: ForwardedRef<RomaineRef>;
  image: File | string;
  onDragStop: (s: CropperState) => void;
  onChange: (s: CropperState) => void;
  pointSize?: number;
  lineWidth?: number;
  lineColor?: string;
  maxWidth: number;
  maxHeight: number;
}
interface CropperSpecificProps {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | undefined>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  previewDims: CalculatedDimensions | undefined;
  imageResizeRatio: number;
  setPreviewDims: React.Dispatch<CalculatedDimensions>;
  showPreview: (imageResizeRatio: number, image?: string) => void;
  setPreviewPaneDimensions: () => void;
  createCanvas: (src: string) => Promise<void>;
}

export const CroppingCanvas = ({
  image,
  onDragStop,
  onChange,
  romaineRef,
  previewCanvasRef,
  canvasRef,
  pointSize = 30,
  lineWidth,
  lineColor,
  // maxWidth,
  // maxHeight,
  previewDims,
  // setPreviewDims,
  imageResizeRatio,
  showPreview,
  // createCanvas,
  setPreviewPaneDimensions,
}: CropperProps & CropperSpecificProps) => {
  const { loaded: cvLoaded, cv } = useRomaine();
  // let canvasRef = useRef<HTMLCanvasElement>();
  // const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const [cropPoints, setCropPoints] = useState<ContourCoordinates>();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("crop");

  useImperativeHandle(
    romaineRef,
    (): RomaineRef => ({
      backToCrop: () => {
        setMode("crop");
      },
      crop: async (opts = {}) => {
        return new Promise((resolve) => {
          if (canvasRef.current && cropPoints) {
            setLoading(true);
            warpPerspective(
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
              opts?.image?.type ||
                (typeof image !== "string" ? image.type : "image/png"),
              opts?.image?.quality || 1
            );
          }
        });
      },
    })
  );

  useEffect(() => {
    if (mode === "preview") {
      showPreview(imageResizeRatio);
    }
  }, [mode]);

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

  // const clearCanvasByRef = (ref: React.RefObject<HTMLCanvasElement>) => {
  //   if (ref.current) {
  //     const magnCtx = ref.current.getContext("2d");
  //     magnCtx && magnCtx.clearRect(0, 0, ref.current.width, ref.current.height);
  //   }
  // };

  useEffect(() => {
    if (onChange && cropPoints) {
      onChange({ ...cropPoints, loading });
    }
  }, [cropPoints, loading]);

  useEffect(() => {
    const bootstrap = async () => {
      // const src = await readFile(image);
      // await createCanvas(src);
      // showPreview(imageResizeRatio);
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
    // if (magnifierCanvasRef.current && previewCanvasRef.current) {
    // const { x, y } = position;
    // const magnCtx = magnifierCanvasRef.current.getContext("2d");
    // clearCanvasByRef(magnifierCanvasRef);
    // TODO we should make those 5, 10 and 20 values proportionate
    // to the point size
    // magnCtx &&
    //   magnCtx.drawImage(
    //     previewCanvasRef.current,
    //     x - (pointSize - 10),
    //     y - (pointSize - 10),
    //     pointSize + 5,
    //     pointSize + 5,
    //     x + 10,
    //     y - 90,
    //     pointSize + 20,
    //     pointSize + 20
    //   );
    console.log(area);
    setCropPoints((cPs) => {
      if (cPs) return { ...cPs, [area]: position };
    });
    // }
  }, []);

  const onStop = useCallback(
    (
      position: CoordinateXY,
      area: keyof ContourCoordinates,
      cropPoints: ContourCoordinates
    ) => {
      const { x, y } = position;

      // clearCanvasByRef(magnifierCanvasRef);
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
    <>
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
        </>
      )}
    </>
  );
};

CroppingCanvas.propTypes = {
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
