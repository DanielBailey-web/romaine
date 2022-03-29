import React from "react";
import T from "prop-types";
import { CropPoint, CropPointProps } from "./CropPoint";

export interface CropPointsProps extends CropPointProps {
  previewDims: {
    ratio: number;
    width: number;
    height: number;
  };
}

const CropPoints = ({ previewDims, ...otherProps }: CropPointsProps) => {
  return (
    <>
      <CropPoint
        pointArea="left-top"
        defaultPosition={{ x: 0, y: 0 }}
        {...otherProps}
      />
      <CropPoint
        pointArea="right-top"
        defaultPosition={{ x: previewDims.width, y: 0 }}
        {...otherProps}
      />
      <CropPoint
        pointArea="right-bottom"
        defaultPosition={{ x: 0, y: previewDims.height }}
        {...otherProps}
      />
      <CropPoint
        pointArea="left-bottom"
        defaultPosition={{
          x: previewDims.width,
          y: previewDims.height,
        }}
        {...otherProps}
      />
    </>
  );
};

export { CropPoints };

CropPoints.propTypes = {
  previewDims: T.shape({
    ratio: T.number,
    width: T.number,
    height: T.number,
  }),
};
