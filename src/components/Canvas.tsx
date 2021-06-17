import React, { forwardRef, useRef, useState } from "react";
// import { Romaine } from "./Romaine";
import { CropperProps, CroppingCanvas } from "./Cropper";
// import { useRomaine } from "../hooks";
import {
  // calcDims,
  CalculatedDimensions,
  // isCrossOriginURL,
  // readFile,
} from "../util";
import { buildImgContainerStyle } from "../util/buildImgContainerStyle";
import { Romaine } from "./Romaine";
import { RomaineRef } from "./Romaine.types";

interface CanvasProps extends CropperProps {
  cropper?: boolean;
}

const CanvasActual = ({ cropper = true, ...props }: CanvasProps) => {
  // const { image, maxHeight, maxWidth } = props;
  const { maxHeight, maxWidth } = props;

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  let canvasRef = useRef<HTMLCanvasElement>();
  const [previewDims, setPreviewDims] = useState<CalculatedDimensions>();

  return (
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
      {cropper && (
        <CroppingCanvas
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
