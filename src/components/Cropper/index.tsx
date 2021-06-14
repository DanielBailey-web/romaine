import React, { forwardRef } from "react";

import { Romaine } from "../Romaine";
import Canvas, { CanvasProps } from "./Canvas/Canvas";
import PropTypes from "prop-types";
import { RomaineRef } from "../Romaine.types";

interface CropperProps extends CanvasProps {
  openCvPath?: string;
}

const Cropper = forwardRef(
  (
    { openCvPath, ...props }: CropperProps,
    ref: React.ForwardedRef<RomaineRef>
  ) => {
    if (!props.image) {
      return null;
    }

    return (
      <Romaine openCvPath={openCvPath}>
        <Canvas {...props} cropperRef={ref} />
      </Romaine>
    );
  }
);

export { Cropper };
export * from "./Canvas";

Cropper.propTypes = {
  openCvPath: PropTypes.string,
};
