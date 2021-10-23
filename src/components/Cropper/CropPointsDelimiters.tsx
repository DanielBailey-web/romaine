import React, { useCallback, useEffect, useRef, useState } from "react";
import T from "prop-types";
import { ContourCoordinates, CoordinateXY } from "..";

interface CropPointsDelimiters {
  // romaineRef: React.RefObject<RomaineRef>;
  crop: Function;
  cropPoints: ContourCoordinates;
  pointSize: number;
  lineColor?: string;
  lineWidth?: number;
  saltId?: string;
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
  // romaineRef,
  crop,
  cropPoints,
  previewDims,
  lineWidth = 3,
  lineColor = "#3cabe2",
  pointSize,
  ...props
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

  /**
   * Takes in a `CoordinateXY` and makes sure that it is inside the `ContourCoordinates`
   *
   * @returns boolean
   *
   * @todo Should use point slope formula for when using perspective cropper
   */
  const xyInPoints = ({ x, y }: CoordinateXY) => {
    if (
      x > cropPoints["left-top"].x &&
      y > cropPoints["left-top"].y &&
      x < cropPoints["right-top"].x &&
      y > cropPoints["right-top"].y &&
      x < cropPoints["right-bottom"].x &&
      y < cropPoints["right-bottom"].y &&
      x > cropPoints["left-bottom"].x &&
      y < cropPoints["left-bottom"].y
    )
      return true;
    return false;
  };
  const getCursorPosition = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (canvas?.current?.getBoundingClientRect) {
      const x = event.clientX - canvas?.current?.getBoundingClientRect().left;
      const y = event.clientY - canvas?.current?.getBoundingClientRect().top;
      if (xyInPoints({ x, y })) return "inside";
      else return "outside";
    }
  };
  const [cursor, setCursor] =
    useState<React.CSSProperties["cursor"]>("default");

  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const cursorPosition = getCursorPosition(e);
    if (cursorPosition === "inside" && cursor !== "crosshair")
      setCursor("crosshair");
    else if (cursorPosition === "outside" && cursor !== "default")
      setCursor("default");
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const cursorPosition = getCursorPosition(e);
    if (cursorPosition === "inside")
      crop({
        preview: true,
        filterCvParams: {
          grayScale: false,
          th: false,
        },
        image: {
          quality: 0.92,
          type: "image/jpeg",
        },
      });
  };

  return (
    <canvas
      id={`${props.saltId ? props.saltId + "-" : ""}crop-point-delimiters`}
      ref={canvas}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        zIndex: 5,
        cursor,
      }}
      width={previewDims.width}
      height={previewDims.height}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursor("default")}
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
