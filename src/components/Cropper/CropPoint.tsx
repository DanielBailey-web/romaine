import React, { useMemo, useCallback, CSSProperties } from "react";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
  DraggableProps,
} from "react-draggable";
import T from "prop-types";
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
  ...cropPointStyles,
  position: "absolute",
});

type PointArea = keyof ContourCoordinates;

export interface CropPointProps {
  pointSize: number;
  cropPoints: any;
  defaultPosition?: ControlPosition;
  onStop: Function;
  onDrag: Function;
  bounds: DraggableProps["bounds"];
  cropPointStyles?: CSSProperties;
}

/**
 * @returns A crop point to use during cropping and image rotation
 */
export const CropPoint = ({
  pointSize,
  cropPoints,
  pointArea,
  defaultPosition,
  onStop: externalOnStop,
  onDrag: externalOnDrag,
  bounds,
  cropPointStyles = {},
}: CropPointProps & { pointArea: PointArea }) => {
  const cropPointStyle = useMemo(() => {
    if (
      cropPointStyles.width !== pointSize ||
      cropPointStyles.height !== pointSize
    ) {
      console.warn("");
    }

    cropPointStyles.width = pointSize;
    cropPointStyles.height = pointSize;

    return buildCropPointStyle(cropPointStyles);
  }, [cropPointStyles, pointSize]);

  const onDrag: DraggableEventHandler = useCallback(
    (_, position) => {
      externalOnDrag(
        {
          ...position,
          x: position.x + pointSize / 2,
          y: position.y + pointSize / 2,
        },
        pointArea
      );
    },
    [externalOnDrag]
  );

  const onStop: DraggableEventHandler = useCallback(
    (_, position) => {
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
    [externalOnDrag, cropPoints]
  );

  return (
    <Draggable
      bounds={bounds}
      defaultPosition={defaultPosition}
      position={{
        x: cropPoints[pointArea].x - pointSize / 2,
        y: cropPoints[pointArea].y - pointSize / 2,
      }}
      onDrag={onDrag}
      onStop={onStop}
    >
      <div style={cropPointStyle} />
    </Draggable>
  );
};

CropPoint.propTypes = {
  cropPoints: T.shape({
    "left-top": T.shape({ x: T.number, y: T.number }).isRequired,
    "right-top": T.shape({ x: T.number, y: T.number }).isRequired,
    "right-bottom": T.shape({ x: T.number, y: T.number }).isRequired,
    "left-bottom": T.shape({ x: T.number, y: T.number }).isRequired,
  }),
  pointArea: T.oneOf(["left-top", "right-top", "right-bottom", "left-bottom"]),
  defaultPosition: T.shape({
    x: T.number,
    y: T.number,
  }),
  onStop: T.func,
  onDrag: T.func,
  cropPointStyles: T.object,
};
