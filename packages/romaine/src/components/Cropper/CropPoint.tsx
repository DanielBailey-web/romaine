import { useMemo, useCallback, useRef, useState, CSSProperties } from "react";
import type { FC, RefObject } from "react";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
  DraggableProps,
} from "react-draggable";
import { useRomaine } from "../../hooks";
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
/**
 * Add default styles to the points
 * Makes sure position absolute cannot be overwritten
 * @param cropPointStyles
 */
const buildCropPointStyle = (
  cropPointStyles: CSSProperties = {}
): CSSProperties => ({
  backgroundColor: "transparent",
  border: "4px solid #3cabe2",
  zIndex: 1001,
  borderRadius: "100%",
  cursor: "grab",
  ...cropPointStyles,
  position: "absolute",
});

type PointArea = keyof ContourCoordinates;

export interface CropPointProps {
  pointSize: number;
  defaultPosition?: ControlPosition;
  onStop: (
    position: CoordinateXY,
    area: keyof ContourCoordinates,
    cropPoints: ContourCoordinates
  ) => void;
  onDrag: (position: CoordinateXY, area: keyof ContourCoordinates) => void;
  bounds: DraggableProps["bounds"];
  cropPointStyles?: CSSProperties;
  previewCanvasRef?: RefObject<HTMLCanvasElement | null>;
}

const MAGNIFIER_SIZE = 120;
const ZOOM_LEVEL = 3;
const MAGNIFIER_OFFSET = 30;

const drawMagnifier = (
  magnifierCanvas: HTMLCanvasElement,
  previewCanvas: HTMLCanvasElement,
  pointX: number,
  pointY: number
) => {
  const ctx = magnifierCanvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

  // Circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    MAGNIFIER_SIZE / 2,
    MAGNIFIER_SIZE / 2,
    MAGNIFIER_SIZE / 2,
    0,
    Math.PI * 2
  );
  ctx.clip();

  // Draw zoomed region from preview canvas
  const sourceSize = MAGNIFIER_SIZE / ZOOM_LEVEL;
  ctx.drawImage(
    previewCanvas,
    pointX - sourceSize / 2,
    pointY - sourceSize / 2,
    sourceSize,
    sourceSize,
    0,
    0,
    MAGNIFIER_SIZE,
    MAGNIFIER_SIZE
  );
  ctx.restore();

  // Border circle
  ctx.beginPath();
  ctx.arc(
    MAGNIFIER_SIZE / 2,
    MAGNIFIER_SIZE / 2,
    MAGNIFIER_SIZE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "#3cabe2";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Crosshair
  ctx.beginPath();
  ctx.moveTo(MAGNIFIER_SIZE / 2 - 8, MAGNIFIER_SIZE / 2);
  ctx.lineTo(MAGNIFIER_SIZE / 2 + 8, MAGNIFIER_SIZE / 2);
  ctx.moveTo(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 - 8);
  ctx.lineTo(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 + 8);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1;
  ctx.stroke();
};

/**
 * @returns A crop point to use during cropping and image rotation
 */
export const CropPoint: FC<CropPointProps & { pointArea: PointArea }> = ({
  pointSize,
  pointArea,
  defaultPosition,
  onStop: externalOnStop,
  onDrag: externalOnDrag,
  bounds,
  cropPointStyles = {},
  previewCanvasRef,
}) => {
  const {
    romaine: { cropPoints },
  } = useRomaine();
  const cropPointStyle = useMemo(() => {
    cropPointStyles.width = pointSize;
    cropPointStyles.height = pointSize;

    return buildCropPointStyle(cropPointStyles);
  }, [cropPointStyles, pointSize]);

  const magnifierRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateMagnifier = useCallback(
    (pointX: number, pointY: number) => {
      if (!magnifierRef.current || !previewCanvasRef?.current) return;
      drawMagnifier(magnifierRef.current, previewCanvasRef.current, pointX, pointY);
    },
    [previewCanvasRef]
  );

  const onStart: DraggableEventHandler = useCallback(
    (_, data) => {
      setIsDragging(true);
      updateMagnifier(data.x + pointSize / 2, data.y + pointSize / 2);
    },
    [pointSize, updateMagnifier]
  );

  const onDrag: DraggableEventHandler = useCallback(
    (_, position) => {
      const px = position.x + pointSize / 2;
      const py = position.y + pointSize / 2;
      externalOnDrag({ ...position, x: px, y: py }, pointArea);
      updateMagnifier(px, py);
    },
    [externalOnDrag, pointArea, pointSize, updateMagnifier]
  );

  const onStop: DraggableEventHandler = useCallback(
    (_, position) => {
      setIsDragging(false);
      externalOnStop(
        {
          ...position,
          x: position.x + pointSize / 2,
          y: position.y + pointSize / 2,
        },
        pointArea,
        cropPoints
      );
    },
    [externalOnStop, cropPoints, pointArea, pointSize]
  );

  const nodeRef = useRef<HTMLDivElement>(null);

  // Position magnifier above or below with hysteresis to prevent flipping
  const magnifierSide = useRef<"above" | "below">("above");
  const pointPos = cropPoints[pointArea];
  const threshold = MAGNIFIER_SIZE + MAGNIFIER_OFFSET;
  const buffer = 40;

  if (magnifierSide.current === "above" && pointPos.y < threshold) {
    magnifierSide.current = "below";
  } else if (magnifierSide.current === "below" && pointPos.y > threshold + buffer) {
    magnifierSide.current = "above";
  }

  const magX = pointPos.x - MAGNIFIER_SIZE / 2;
  const magY = magnifierSide.current === "above"
    ? pointPos.y - MAGNIFIER_SIZE - MAGNIFIER_OFFSET
    : pointPos.y + pointSize + MAGNIFIER_OFFSET;

  return (
    <>
      <Draggable
        nodeRef={nodeRef as React.RefObject<HTMLElement>}
        bounds={bounds}
        defaultPosition={defaultPosition}
        position={{
          x: pointPos.x - pointSize / 2,
          y: pointPos.y - pointSize / 2,
        }}
        onStart={onStart}
        onDrag={onDrag}
        onStop={onStop}
      >
        <div ref={nodeRef} style={cropPointStyle} />
      </Draggable>
      <canvas
        ref={magnifierRef}
        width={MAGNIFIER_SIZE}
        height={MAGNIFIER_SIZE}
        style={{
          position: "absolute",
          left: magX,
          top: magY,
          width: MAGNIFIER_SIZE,
          height: MAGNIFIER_SIZE,
          borderRadius: "50%",
          zIndex: 1002,
          pointerEvents: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          display: isDragging ? "block" : "none",
        }}
      />
    </>
  );
};
