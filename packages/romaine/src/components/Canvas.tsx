import type {
  ReactNode,
  ForwardedRef,
  RefObject,
  DetailedHTMLProps,
  HTMLAttributes,
} from "react";
import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  useCallback,
  useMemo,
} from "react";
import { CropperState, CroppingCanvas } from "./Cropper";
import {
  calcDims,
  CalculatedDimensions,
  isCrossOriginURL,
  readFile,
} from "../util";
import { buildImgContainerStyle } from "../util/buildImgContainerStyle";
import { CropFunc, RomaineRef } from "./Romaine.types";
import { useRomaine } from "../hooks";
import { SetPreviewPaneDimensions, ShowPreview } from "../types";

export type CanvasProps = {
  ref: ForwardedRef<RomaineRef> | RefObject<RomaineRef>;
  image: File | string;
  onDragStop: (s: CropperState) => void;
  onChange: (s: CropperState) => void;
  pointSize?: number;
  lineWidth?: number;
  lineColor?: string;
  maxWidth: number;
  maxHeight: number;
  saltId?: string;
};
let imageResizeRatio = 1;
const CanvasActual_ = (
  props: CanvasProps,
  romaineRef: ForwardedRef<RomaineRef>
) => {
  const {
    cv,
    romaine: { mode, angle, history, clearHistory },
    setMode,
    pushHistory,
    undo,
  } = useRomaine();
  useImperativeHandle(
    romaineRef,
    (): RomaineRef => ({
      getBlob: async (opts = {}) => {
        return new Promise((resolve) => {
          if (canvasRef.current) {
            canvasRef.current.toBlob(
              (blob) => {
                resolve(blob);
                setLoading(false);
                setMode && setMode(null);
              },
              opts?.type === "keep-same"
                ? typeof image !== "string"
                  ? image.type
                  : "image/png"
                : opts?.type,
              opts?.quality
            );
          }
        });
      },
      getDataURL: async (opts = {}) => {
        return new Promise((resolve, reject) => {
          try {
            if (canvasRef.current) {
              resolve(
                canvasRef.current.toDataURL(
                  opts?.type === "keep-same"
                    ? typeof image !== "string"
                      ? image.type
                      : "image/png"
                    : opts?.type,
                  opts?.quality
                )
              );
            }
          } catch (err) {
            reject();
          }
        });
      },
    })
  );

  const { maxHeight, maxWidth, image } = props;
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>();
  const cropRef = useRef<CropFunc>();
  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>({
    height: maxHeight,
    width: maxWidth,
    ratio: 1,
  });
  const [loading, setLoading] = useState(true);
  // don't use 0 as original dims or there is possibly divide by zero error in setPreviewPaneDimensions
  const [originalDims, setOriginalDims] = useState({ height: 1, width: 1 });

  const setPreviewPaneDimensions: SetPreviewPaneDimensions = useCallback(
    (dims = originalDims) => {
      if (dims && previewCanvasRef?.current) {
        const newPreviewDims = calcDims(
          dims.width,
          dims.height,
          maxWidth,
          maxHeight
        );
        setPreviewDims(newPreviewDims);

        previewCanvasRef.current.width = newPreviewDims.width;
        previewCanvasRef.current.height = newPreviewDims.height;
        imageResizeRatio = newPreviewDims.width / dims.width;
        return imageResizeRatio;
      }
    },
    [originalDims, maxHeight, maxWidth]
  );
  /**
   *
   * @global `imageResizeRatio` maxWidth / width
   * @global `src` (optional) The openCV imread pointer defaults to `cv.imread(canvasRef.current)`
   * @param cleanup (default is true) Should the src object be cleaned up
   * only use false if cleaning up your own src object! Otherwise this will result in memory leak!
   */
  const showPreview: ShowPreview = (
    resizeRatio = imageResizeRatio,
    source = cv.imread(canvasRef.current),
    cleanup = true
  ) => {
    if (cv && previewCanvasRef.current) {
      const dst = new cv.Mat();
      const dsize = new cv.Size(0, 0);
      cv.resize(source, dst, dsize, resizeRatio, resizeRatio, cv.INTER_AREA);
      cv.imshow(previewCanvasRef.current, dst);
      if (cleanup) source.delete();
      dst.delete();
    }
  };

  // window resizing re-render canvas
  const resizeTimeout = useRef(0);
  useEffect(() => {
    const windowResizeEvent = () => {
      // timeout 1s for resize event to finish
      const resizeRatio = setPreviewPaneDimensions();
      if (resizeRatio !== Infinity) {
        clearTimeout(resizeTimeout.current);
        const timeout = setTimeout(() => {
          showPreview(resizeRatio);
        }, 1000);
        resizeTimeout.current = timeout;
      }
    };
    windowResizeEvent();
  }, [setPreviewPaneDimensions]);

  const createCanvas = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const img = document.createElement("img");
        img.onload = async () => {
          // set edited image canvas and dimensions
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.id = `${
            props.saltId ? props.saltId + "-" : ""
          }working-canvas`;
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          setOriginalDims({ height: img.height, width: img.width });
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#fff0";
            ctx.fillRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            setPreviewPaneDimensions({ height: img.height, width: img.width });
            return resolve();
          }
          return reject();
        };
        if (isCrossOriginURL(src)) img.crossOrigin = "anonymous";
        img.src = src;
      } catch (err) {
        reject();
      }
    });
  };

  // use a callback so that if the image is dynamic we aren't downloading a new one every time
  const ReadFile = useCallback(() => {
    return readFile(image);
  }, [image]);

  // this function will do a full reset on the image removing all progress (also used on startup)
  const Restart = async () => {
    setLoading(true);
    canvasRef.current = undefined;
    await createCanvas(await ReadFile());
    cv && showPreview();
    setLoading(false);
  };

  useEffect(() => {
    if (cv) {
      Restart();
    }
  }, [cv, image]);

  const rotate_bound = (canvas: HTMLCanvasElement, angle: number) => {
    if (mode !== "undo" && mode !== "redo") pushHistory && pushHistory();

    const src = cv.imread(canvasRef.current);
    const dst = new cv.Mat();
    const center = new cv.Point(src.cols / 2, src.rows / 2);

    const M1_temp = cv.getRotationMatrix2D(center, angle, 1);
    const a = [...M1_temp.data64F];
    M1_temp.delete();

    const cos = Math.abs(a[0]);
    const sin = Math.abs(a[3]);

    // compute the new bounding dimensions of the image
    const newWidth = ~~(src.rows * sin + src.cols * cos);
    const newHeight = ~~(src.rows * cos + src.cols * sin);

    /**
     * Col 3 Row 1 is horizontal transform (numerical position away from y axis)
     *
     * Col 3 Row 2 is vertical transform ("" y axis)
     *
     * @description
     * This code is a modified version of rotate_bound found in python package imutils
     * @link
     * https://github.com/jrosebr1/imutils/blob/c12f15391fcc945d0d644b85194b8c044a392e0a/imutils/convenience.py#L41
     */
    const M1 = [
      [a[0], a[1], a[2] + newWidth / 2 - center.x],
      [a[3], a[4], a[5] + newHeight / 2 - center.y],
    ];

    const oneDimensionalArray = ([] as number[]).concat.apply([], M1);
    const M = cv.matFromArray(2, 3, cv.CV_64FC1, oneDimensionalArray);

    canvas.height = newHeight;
    canvas.width = newWidth;
    setPreviewPaneDimensions({ height: newHeight, width: newWidth });
    // this is the slowest step
    cv.warpAffine(
      src,
      dst,
      M,
      { height: newHeight, width: newWidth },
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );
    M.delete();
    src.delete();
    setTimeout(() => {
      // show the real preview first so it works faster for user
      // due to this we must cleanup dst ourselves
      if (mode !== "undo" && mode !== "redo")
        showPreview(imageResizeRatio, dst, false);
      dst.delete();
      // finished, set the mode back to null
      setMode && setMode(null);
    }, 0);
    cv.imshow(canvas, dst);
  };
  // opencv documentation
  // https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
  useEffect(() => {
    if (canvasRef.current) {
      if (mode === "rotate-left") {
        rotate_bound(canvasRef.current, angle);
      } else if (mode === "rotate-right") {
        rotate_bound(canvasRef.current, 360 - angle);
      } else if (mode === "full-reset") {
        clearHistory();
        Restart();
        setMode && setMode(null);
      } else if (mode === "undo") {
        const length = history.pointer - 1;
        Restart().then(() => {
          if (!canvasRef.current) return;
          for (let i = 0; i < length; i++) {
            const imageResizeRatio = setPreviewPaneDimensions({
              width: canvasRef.current.width,
              height: canvasRef.current.height,
            });
            switch (history.commands[i].cmd) {
              case "rotate-left":
                rotate_bound(canvasRef.current, history.commands[i].payload);
                break;
              case "rotate-right":
                rotate_bound(canvasRef.current, history.commands[i].payload);
                break;
              case "crop":
                cropRef.current?.({
                  preview: false,
                  cropPoints: history.commands[i].payload,
                  imageResizeRatio,
                  mode: history.commands[i].cmd,
                });
                break;
              case "perspective-crop":
                cropRef.current?.({
                  preview: false,
                  cropPoints: history.commands[i].payload,
                  imageResizeRatio,
                  mode: history.commands[i].cmd,
                });
                break;
            }
          }
          undo();
          setMode && setMode("preview");
        });
      } else if (mode === "preview") {
        showPreview(
          setPreviewPaneDimensions({
            width: canvasRef.current.width,
            height: canvasRef.current.height,
          })
        );
        setMode && setMode(null);
      }
    }
  }, [mode]);
  return (
    <div
      style={{
        position: "relative",
        ...(previewDims && buildImgContainerStyle(previewDims)),
      }}
    >
      <canvas
        id={`${props.saltId ? props.saltId + "-" : ""}preview-canvas`}
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
        width={maxWidth}
        height={maxHeight}
      />
      {(mode === "crop" || mode === "perspective-crop") && !loading && (
        <CroppingCanvas
          cropRef={cropRef}
          romaineRef={romaineRef as RefObject<RomaineRef>}
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
const CanvasActual = forwardRef(CanvasActual_);
export interface RomaineCanvas
  extends Omit<Omit<CanvasProps, "image">, "romaineRef"> {
  openCvPath?: string;
  children?: ReactNode;
  image: File | string | null;
  wrapperProps?: DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
}
/**
 * This function is to make sure the the user is using Romaine context
 *
 * Can also pass children that can be absolutely positioned
 */
const _Canvas = (
  { openCvPath, children, image, wrapperProps = {}, ...props }: RomaineCanvas,
  ref: ForwardedRef<RomaineRef>
) => {
  const { cv, loaded } = useRomaine();
  const salt = useMemo(
    () => `${props.saltId ? props.saltId + "-" : ""}romaine-wrapper`,
    []
  );
  return cv || loaded ? (
    <div
      id={salt}
      {...wrapperProps}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: props.maxWidth,
        height: props.maxHeight,
        ...wrapperProps.style,
      }}
    >
      {children}
      {image && cv && <CanvasActual image={image} {...props} ref={ref} />}
    </div>
  ) : null;
};

export const Canvas = forwardRef<RomaineRef, RomaineCanvas>(_Canvas);
