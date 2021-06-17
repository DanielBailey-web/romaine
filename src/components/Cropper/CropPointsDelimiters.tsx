import React, { useCallback, useEffect, useRef } from "react";
import T from "prop-types";
import { ContourCoordinates, CoordinateXY } from "..";

interface CropPointsDelimiters {
  cropPoints: ContourCoordinates;
  pointSize: number;
  lineColor?: string;
  lineWidth?: number;
  previewDims: {
    width: number;
    height: number;
    ratio: number;
  };
}
/**
 * Create the lines for the cropper utility
 */
const CropPointsDelimiters = ({
  cropPoints,
  previewDims,
  lineWidth = 3,
  lineColor = "#3cabe2",
  pointSize,
}: CropPointsDelimiters) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  const clearCanvas = useCallback(() => {
    if (canvas.current) {
      const ctx = canvas.current.getContext("2d");
      ctx && ctx.clearRect(0, 0, previewDims.width, previewDims.height);
    }
  }, [canvas.current, previewDims]);

  const sortPoints = useCallback(() => {
    const sortOrder = [
      "left-top",
      "right-top",
      "right-bottom",
      "left-bottom",
    ] as const;
    return sortOrder.reduce(
      (acc, pointPos) => [...acc, cropPoints[pointPos]],
      [] as CoordinateXY[]
    );
  }, [cropPoints]);

  const drawShape = useCallback(
    ([point1, point2, point3, point4]) => {
      const ctx = canvas.current && canvas.current.getContext("2d");
      if (ctx) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;

        ctx.beginPath();
        ctx.moveTo(point1.x + pointSize / 2, point1.y);
        ctx.lineTo(point2.x - pointSize / 2, point2.y);

        ctx.moveTo(point2.x, point2.y + pointSize / 2);
        ctx.lineTo(point3.x, point3.y - pointSize / 2);

        ctx.moveTo(point3.x - pointSize / 2, point3.y);
        ctx.lineTo(point4.x + pointSize / 2, point4.y);

        ctx.moveTo(point4.x, point4.y - pointSize / 2);
        ctx.lineTo(point1.x, point1.y + pointSize / 2);
        ctx.closePath();
        ctx.stroke();
      }
    },
    [canvas.current]
  );

  useEffect(() => {
    if (cropPoints && canvas.current) {
      clearCanvas();
      const sortedPoints = sortPoints();
      drawShape(sortedPoints);
    }
  }, [cropPoints, canvas.current]);

  return (
    <canvas
      id="crop-point-delimiters"
      ref={canvas}
      style={{
        position: "absolute",
        zIndex: 5,
      }}
      width={previewDims.width}
      height={previewDims.height}
    />
  );
};

export { CropPointsDelimiters };

CropPointsDelimiters.propTypes = {
  previewDims: T.shape({
    ratio: T.number,
    width: T.number,
    height: T.number,
  }),
  cropPoints: T.shape({
    "left-top": T.shape({ x: T.number, y: T.number }).isRequired,
    "right-top": T.shape({ x: T.number, y: T.number }).isRequired,
    "right-bottom": T.shape({ x: T.number, y: T.number }).isRequired,
    "left-bottom": T.shape({ x: T.number, y: T.number }).isRequired,
  }),
  lineColor: T.string,
  lineWidth: T.number,
  pointSize: T.number,
};
