import { useContext } from "react";
import { OpenCvContext } from "../components/romaine";
export type { CanvasApi } from "../components/romaine";

export const useRomaine = () => useContext(OpenCvContext);
