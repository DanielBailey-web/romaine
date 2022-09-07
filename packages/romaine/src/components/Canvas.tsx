import type {
  ReactNode,
  ForwardedRef,
  DetailedHTMLProps,
  HTMLAttributes,
} from "react";
import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  useMemo,
} from "react";
import { CropperState, CroppingCanvas } from "./Cropper";
import { buildImgContainerStyle } from "../util/buildImgContainerStyle";
import { CropFunc, RomaineRef } from "./Romaine.types";
import { useRomaine } from "../hooks";
import { usePreview } from "./romaine/usePreview";
import { useCanvas } from "./romaine/useCanvas";
import { ImagePtr } from "../types";
import { handleModeChange } from "../util/image/mode";
// import { createFilterMat } from "../util/image/filter/createFilterMat";
// import { sepia } from "../util/image/filter/sepia";

export type CanvasProps = {
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
const CanvasActual_ = (
  props: Omit<CanvasProps, "ref">,
  romaineRef: ForwardedRef<RomaineRef>
) => {
  // get the props we need
  const { maxHeight, maxWidth, image, saltId } = props;
  const maxDims = useMemo(
    () => ({ maxHeight, maxWidth }),
    [maxHeight, maxWidth]
  );

  const romaine = useRomaine();
  const {
    cv,
    romaine: { mode },
    setMode,
  } = romaine;

  const [cropFunc, setCropFunc] = useState<CropFunc | null>(null);

  useImperativeHandle(
    romaineRef,
    (): RomaineRef => ({
      getBlob: async (opts = {}) => {
        return new Promise((resolve) => {
          if (canvasPtr.current) {
            cv.imshow(canvasRef.current, canvasPtr.current);
            canvasRef.current.toBlob(
              (blob) => {
                resolve(blob);
                setLoading(false);
                setMode?.(null);
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
      crop: async () => {
        await cropFunc?.({ preview: true });
        setMode?.(null);
      },
    })
  );
  const _canvas = useCanvas({
    image,
    saltId,
  });
  const { canvasRef, originalImageDims, loaded, canvasPtr } = _canvas;

  const _preview = usePreview({
    canvasRef,
    maxDims,
    originalImageDims,
  });
  const {
    createPreview,
    previewRef: previewCanvasRef,
    previewDims,
    setPreviewPaneDimensions,
    imageResizeRatio,
  } = _preview;

  // initial preview
  useEffect(() => {
    if (loaded && mode !== "undo")
      createPreview(
        setPreviewPaneDimensions(originalImageDims),
        canvasPtr.current,
        false
      );
  }, [loaded]);
  // useEffect(() => {
  //   if (loaded && mode !== "undo") {
  //     //   //@ts-ignore
  //     //   console.log("create sepia", cv.bitwise_not);
  //     //   // const M = cv.Mat.eye(3, 3, cv.CV_32FC1);
  //     //   const sepiaKernel = createFilterMat(cv, sepia);
  //     const irr = setPreviewPaneDimensions(originalImageDims);
  //     //   if (canvasPtr.current) {
  //     //     // let anchor = new cv.Point(-1, -1);
  //     //     // stencil
  //     //     //@ts-ignore
  //     //     // cv.adaptiveThreshold(
  //     //     //   canvasPtr.current,
  //     //     //   canvasPtr.current,
  //     //     //   200,
  //     //     //   //@ts-ignore
  //     //     //   cv.ADAPTIVE_THRESH_GAUSSIAN_C,
  //     //     //   cv.THRESH_BINARY,
  //     //     //   3,
  //     //     //   2
  //     //     // );
  //     //     // cv.cvtColor(
  //     //     //   canvasPtr.current,
  //     //     //   canvasPtr.current,
  //     //     //   //@ts-ignore
  //     //     //   cv.COLOR_RGBA2BGRA,
  //     //     //   0
  //     //     // );
  //     //     //@ts-ignore
  //     //     // cv.transform(canvasPtr.current, canvasPtr.current, sepiaKernel);
  //     //     // cv.cvtColor(canvasPtr.current, canvasPtr.current, cv.COLOR_BGR2HSV, 0);
  //     //     cv.bitwise_not(canvasPtr.current, canvasPtr.current);
  //     //   }
  //     createPreview(irr, canvasPtr.current, false);
  //     //   sepiaKernel.delete();
  //   }
  // }, [loaded]);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (loaded && canvasPtr.current?.$$.ptr) setLoading(false);
  }, [loaded]);
  // window resizing re-render canvas
  const resizeTimeout = useRef(0);
  useEffect(() => {
    const windowResizeEvent = () => {
      // timeout 1s for resize event to finish
      const resizeRatio = setPreviewPaneDimensions(
        canvasPtr.current && {
          width: canvasPtr.current.cols,
          height: canvasPtr.current.rows,
        }
      );
      if (resizeRatio !== Infinity) {
        clearTimeout(resizeTimeout.current);
        const timeout = setTimeout(() => {
          createPreview(resizeRatio, canvasPtr.current, false);
        }, 250);
        resizeTimeout.current = timeout;
      }
    };
    if (!loading) windowResizeEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPreviewPaneDimensions]);

  // opencv documentation
  // https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
  useEffect(() => {
    handleModeChange({ romaine, _preview, _canvas });
    if (canvasRef.current && !loading) {
      // if (mode === "undo" && canvasPtr.current?.$$.ptr && loaded) {
      //   const length = history.pointer - 1;
      //   if (!canvasRef.current) {
      //     console.log("canvasRef is null");
      //     return;
      //   }
      //   for (let i = 0; i < length; i++) {
      //     const imageResizeRatio = setPreviewPaneDimensions({
      //       width: canvasRef.current.width,
      //       height: canvasRef.current.height,
      //     });
      //     switch (history.commands[i].cmd) {
      //       case "rotate-left":
      //         console.log("ptr:", canvasPtr.current?.$$.ptr);
      //         rotate(
      //           cv,
      //           canvasRef.current,
      //           mode,
      //           setPreviewPaneDimensions,
      //           createPreview,
      //           {
      //             angle: history.commands[i].payload,
      //             preview: false,
      //             cleanup: false,
      //           },
      //           canvasPtr.current
      //         );
      //         break;
      //       case "rotate-right":
      //         rotate(
      //           cv,
      //           canvasRef.current,
      //           mode,
      //           setPreviewPaneDimensions,
      //           createPreview,
      //           {
      //             angle: history.commands[i].payload,
      //             preview: false,
      //             cleanup: false,
      //           },
      //           canvasPtr.current
      //         );
      //         break;
      //       case "crop":
      //         cropFunc?.({
      //           preview: false,
      //           cropPoints: history.commands[i].payload,
      //           imageResizeRatio,
      //           mode: history.commands[i].cmd,
      //         });
      //         break;
      //       case "perspective-crop":
      //         cropFunc?.({
      //           preview: false,
      //           cropPoints: history.commands[i].payload,
      //           imageResizeRatio,
      //           mode: history.commands[i].cmd,
      //         });
      //         break;
      //     }
      //   }
      //   undo();
      //   setMode?.("preview");
      // }
    }
  }, [mode, loaded]);
  return (
    <div
      style={{
        position: "relative",
        ...(previewDims && buildImgContainerStyle(previewDims)),
      }}
    >
      <canvas
        id={`${saltId ? saltId + "-" : ""}preview-canvas`}
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
      {(mode === "crop" || mode === "perspective-crop") &&
        !loading &&
        canvasPtr.current?.$$.ptr && (
          <CroppingCanvas
            setCropFunc={setCropFunc}
            imageResizeRatio={imageResizeRatio}
            setPreviewPaneDimensions={setPreviewPaneDimensions}
            showPreview={createPreview}
            canvasRef={canvasRef}
            canvasPtr={canvasPtr as React.MutableRefObject<ImagePtr>}
            previewCanvasRef={previewCanvasRef}
            previewDims={previewDims}
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
