import React, { useCallback, useEffect, useState } from "react";
import { useRomaine } from "../../hooks";

import {
  CalculatedDimensions,
  // readFile,
  // isCrossOriginURL,
  // applyFilter,
  warpPerspective,
  cropOpenCV,
} from "../../util";

import { CropPoints } from "./CropPoints";
import { CropPointsDelimiters } from "./CropPointsDelimiters";
import { ContourCoordinates, CoordinateXY } from ".";
import { CropFunc } from "../Romaine.types";
import { CanvasProps } from "../Canvas";
import { ImagePtr, ShowPreview, size } from "../../types";

// const imageDimensions = { width: 0, height: 0 };

export interface CropperState extends ContourCoordinates {
  loading: boolean;
}

export interface CropperSpecificProps
  extends Pick<
    CanvasProps,
    | "lineColor"
    | "lineWidth"
    | "saltId"
    | "pointSize"
    | "image"
    | "onDragStop"
    | "onChange"
  > {
  /** The canvas which we pass to OpenCV for manipulations */
  canvasRef: React.MutableRefObject<HTMLCanvasElement | undefined>;
  /** The canvas we display images on */
  previewCanvasRef: React.RefObject<HTMLCanvasElement>;
  /** The canvas we draw the lines connecting the crop points on */
  previewDims: CalculatedDimensions | undefined;
  imageResizeRatio: number;
  showPreview: ShowPreview;
  setPreviewPaneDimensions: (dims?: size) => undefined | number;
  setCropFunc: React.Dispatch<React.SetStateAction<CropFunc | null>>;
  canvasPtr: React.MutableRefObject<ImagePtr>;
}

export const CroppingCanvas = ({
  image,
  onDragStop,
  onChange,
  previewCanvasRef,
  setCropFunc,
  pointSize = 30,
  lineWidth,
  lineColor,
  previewDims,
  imageResizeRatio,
  showPreview,
  setPreviewPaneDimensions,
  saltId,
  canvasPtr,
}: CropperSpecificProps) => {
  const {
    loaded: cvLoaded,
    cv,
    romaine: { mode, cropPoints },
    setMode,
    pushHistory,
    setCropPoints,
  } = useRomaine();
  // const [_worker, setWorker] = useState<Worker | null>();
  // useEffect(() => {
  //   if (window.Worker) {
  //     const worker = new Worker("./test.js");
  //     worker.onmessage = function (e) {
  //       console.log(e.data);
  //       console.log("Message received from worker");
  //     };
  //     worker.postMessage([20, 30]);
  //     setWorker(worker);
  //   }
  // }, []);

  const [loading, setLoading] = useState(false);

  const cropCB: CropFunc = useCallback(
    async (opts = {}) => {
      // need to figure out how to not need this and still render
      setLoading(true);
      // push can be moved to mode
      pushHistory?.();
      return new Promise<void>((resolve) => {
        if (!opts.cropPoints) opts.cropPoints = cropPoints;
        if (!opts.imageResizeRatio) opts.imageResizeRatio = imageResizeRatio;
        if (!opts.mode) opts.mode = mode;

        if (opts.cropPoints) {
          if (opts.mode === "crop")
            cropOpenCV(
              cv,
              canvasPtr.current,
              opts.cropPoints,
              opts.imageResizeRatio
              // canvasRef.current,
            );
          else if (opts.mode === "perspective-crop")
            warpPerspective(
              cv,
              canvasPtr.current,
              opts.cropPoints,
              opts.imageResizeRatio
            );
          else return setLoading(false);

          // @todo implement this somewhere
          // applyFilter(cv, canvasRef.current, opts.filterCvParams);
          if (opts.preview) {
            const dims = canvasPtr.current.size();
            const irr = setPreviewPaneDimensions(dims);
            showPreview(irr, canvasPtr.current, false);
            setMode?.(null);
          }
          setLoading(false);
          return resolve();
        }
      });
    },
    // disabling because eslint doesn't know that canvasRef is a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cv,
      cropPoints,
      mode,
      pushHistory,
      setLoading,
      setMode,
      setPreviewPaneDimensions,
      imageResizeRatio,
    ]
  );
  useEffect(() => {
    console.log("changed cropCB");
    setCropFunc(() => cropCB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropCB]);

  const detectContours = () => {
    /*
     * warning, this function will alter the canvasPtr
     *
     * Remember to copy pointer to new variable if you want to keep it
     * Make sure to clean up variable also
     */
    const dst = new cv.Mat();
    canvasPtr.current.copyTo(dst);
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

    const contourCoordinates: ContourCoordinates = {
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

  useEffect(() => {
    if (onChange && cropPoints) {
      onChange({ ...cropPoints, loading });
    }
  }, [cropPoints, loading]);
  /**
   * @todo
   * 1) Need to make sure that this is valid to never run the other code
   *   if it is, then need to remove the code in the else block
   */
  const bootstrap = async () => {
    detectContours();
    setLoading(false);
    // else {
    //   // imread is SLOW
    //   const src = cv.imread(previewCanvasRef.current);
    //   const contourCoordinates = {
    //     "left-top": { x: 0, y: 0 },
    //     "right-top": { x: src.cols, y: 0 },
    //     "right-bottom": {
    //       x: src.cols,
    //       y: src.rows,
    //     },
    //     "left-bottom": { x: 0, y: src.rows },
    //   };

    //   setCropPoints(contourCoordinates);
    // }
  };
  console.log("well this function ran");

  useEffect(() => {
    if (
      image &&
      previewCanvasRef.current &&
      cvLoaded &&
      (mode === "crop" || mode === "perspective-crop")
    ) {
      bootstrap();
    } else {
      setLoading(true);
    }
  }, [image, cvLoaded, mode]);

  const handleNormalCornerMove = useCallback(
    (
      position: CoordinateXY,
      area: keyof ContourCoordinates,
      cPs: ContourCoordinates | undefined
    ): ContourCoordinates | undefined => {
      const { x, y } = position;
      if (cPs) {
        switch (area) {
          case "left-bottom":
            return {
              ...cPs,
              [area]: { x, y },
              "left-top": { x, y: cPs["left-top"].y },
              "right-bottom": { x: cPs["right-bottom"].x, y },
            };
          case "right-bottom":
            return {
              ...cPs,
              [area]: { x, y },
              "right-top": { x, y: cPs["right-top"].y },
              "left-bottom": { x: cPs["left-bottom"].x, y },
            };
          case "right-top":
            return {
              ...cPs,
              [area]: { x, y },
              "left-top": { x: cPs["left-top"].x, y },
              "right-bottom": { x, y: cPs["right-bottom"].y },
            };
          case "left-top":
            return {
              ...cPs,
              [area]: { x, y },
              "left-bottom": { x, y: cPs["left-bottom"].y },
              "right-top": { x: cPs["right-top"].x, y },
            };
        }
      }
    },
    []
  );

  const onCornerDrag = useCallback(
    (position: CoordinateXY, area: keyof ContourCoordinates) => {
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
      setCropPoints((cPs) => {
        if (cPs && mode === "perspective-crop")
          return { ...cPs, [area]: position };
        return handleNormalCornerMove(position, area, cPs);
      });
      // }
    },
    [mode, setCropPoints, handleNormalCornerMove]
  );

  const onCornerStop = useCallback(
    (
      position: CoordinateXY,
      area: keyof ContourCoordinates,
      cropPoints: ContourCoordinates
    ) => {
      const { x, y } = position;

      // clearCanvasByRef(magnifierCanvasRef);
      setCropPoints((cPs) => {
        if (cPs && mode === "perspective-crop")
          return { ...cPs, [area]: { x, y } as CoordinateXY };
        return handleNormalCornerMove(position, area, cPs);
      });
      onDragStop?.({ ...cropPoints, [area]: { x, y }, loading });
    },
    [mode, setCropPoints, handleNormalCornerMove]
  );

  return (
    <>
      {previewDims &&
        (mode === "crop" || mode === "perspective-crop") &&
        cropPoints && (
          <>
            <CropPoints
              pointSize={pointSize}
              previewDims={previewDims}
              onDrag={onCornerDrag}
              onStop={onCornerStop}
              bounds={{
                left:
                  (previewCanvasRef?.current?.offsetLeft || 0) - pointSize / 2,
                top:
                  (previewCanvasRef?.current?.offsetTop || 0) - pointSize / 2,
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
              // romaineRef={romaineRef as React.RefObject<RomaineRef>}
              crop={cropCB}
              previewDims={previewDims}
              cropPoints={cropPoints}
              lineWidth={lineWidth}
              lineColor={lineColor}
              pointSize={pointSize}
              saltId={saltId}
            />
          </>
        )}
    </>
  );
};
