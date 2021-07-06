import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
  useState,
  ForwardedRef,
  useImperativeHandle,
} from "react";
import { CropperState, CroppingCanvas } from "./Cropper";
import {
  calcDims,
  CalculatedDimensions,
  isCrossOriginURL,
  readFile,
} from "../util";
import { buildImgContainerStyle } from "../util/buildImgContainerStyle";
import { RomaineRef } from "./Romaine.types";
import { useRomaine } from "../hooks";

export interface CanvasProps {
  romaineRef: ForwardedRef<RomaineRef> | React.RefObject<RomaineRef>;
  image: File | string;
  onDragStop: (s: CropperState) => void;
  onChange: (s: CropperState) => void;
  pointSize?: number;
  lineWidth?: number;
  lineColor?: string;
  maxWidth: number;
  maxHeight: number;
}
let imageResizeRatio = 1;
const CanvasActual = ({ romaineRef, ...props }: CanvasProps) => {
  const {
    cv,
    romaine: { mode },
    setMode,
  } = useRomaine();

  useImperativeHandle(
    romaineRef,
    (): RomaineRef => ({
      getBlob: async (opts = {}) => {
        return new Promise((resolve) => {
          if (canvasRef.current) {
            canvasRef.current.toBlob(
              (blob) => {
                // blob.name = image.name;
                resolve(blob);
                setLoading(false);
                setMode && setMode(null);
              },
              opts?.type ||
                (typeof image !== "string" ? image.type : "image/png"),
              opts?.quality || 1
            );
          }
        });
      },
    })
  );

  const { maxHeight, maxWidth, image } = props;

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>();
  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>({
    height: maxHeight,
    width: maxWidth,
    ratio: 1,
  });
  const [loading, setLoading] = useState(true);
  const [originalDims, setOriginalDims] = useState({ height: 0, width: 0 });

  const setPreviewPaneDimensions = (
    dims: typeof originalDims = originalDims
  ) => {
    if (dims && previewCanvasRef?.current) {
      let newPreviewDims = calcDims(
        dims.width,
        dims.height,
        maxWidth,
        maxHeight
      );

      setPreviewDims(newPreviewDims);

      previewCanvasRef.current.width = newPreviewDims.width;
      previewCanvasRef.current.height = newPreviewDims.height;

      imageResizeRatio = newPreviewDims.width / dims.width;
    }
  };
  /**
   *
   * @param imageResizeRatio maxWidth / width
   * @param src (optional) The openCV imread pointer defaults to `cv.imread(canvasRef.current)`
   * @param cleanup (default is true) Should the src object be cleaned up
   * only use false if cleaning up your own src object! Otherwise this will result in memory leak!
   */
  const showPreview = (
    imageResizeRatio: number,
    source: any = cv.imread(canvasRef.current),
    cleanup: boolean = true
  ) => {
    const dst = new cv.Mat();
    const dsize = new cv.Size(0, 0);
    cv.resize(
      source,
      dst,
      dsize,
      imageResizeRatio,
      imageResizeRatio,
      cv.INTER_AREA
    );
    cv.imshow("preview-canvas", dst);
    if (cleanup) source.delete();
    dst.delete();
  };

  const createCanvas = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const img = document.createElement("img");
        img.onload = async () => {
          // set edited image canvas and dimensions
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.id = "working-canvas";
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

  useEffect(() => {
    setLoading(true);
    readFile(image).then(async (res) => {
      await createCanvas(res);
      showPreview(imageResizeRatio);
      setLoading(false);
    });
  }, [cv, image]);

  const rotate_bound = (canvas: HTMLCanvasElement, angle: number) => {
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
      showPreview(imageResizeRatio, dst, false);
      cv.imshow(canvas, dst);
      dst.delete();
      // finished, set the mode back to null
      setMode && setMode(null);
    }, 0);
  };
  // opencv documentation
  // https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html
  useEffect(() => {
    if (canvasRef.current) {
      if (mode === "rotate-left") {
        const angle = 1;
        rotate_bound(canvasRef.current, angle);
      } else if (mode === "rotate-right") {
        const angle = 359;
        rotate_bound(canvasRef.current, angle);
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
        width={maxWidth}
        height={maxHeight}
      />
      {(mode === "crop" || mode === "perspective-crop") && !loading && (
        <CroppingCanvas
          romaineRef={romaineRef as React.RefObject<RomaineRef>}
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
  )
);
