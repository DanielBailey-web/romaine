import { Offsets, ShowPreview, SetPreviewPaneDimensions } from ".";
import { OpenCV } from "../components";

export type AddPadding = (
  cv: OpenCV,
  src: HTMLCanvasElement,
  points: Partial<Offsets>,
  callbacks: {
    showPreview: ShowPreview;
    setPreviewPaneDimensions: SetPreviewPaneDimensions;
  }
) => void;
