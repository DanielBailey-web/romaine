import { RomaineState } from ".";
import { ContourCoordinates } from "../../components";
import { history } from "./history";
export type RomaineCommands =
  | "crop"
  | "perspective-crop"
  | "rotate-right"
  | "rotate-left"
  | "full-reset"
  | "undo"
  | "redo"
  | "preview"
  | "flip-horizontal"
  | "flip-vertical"
  | "scale";
export type RomaineModes = null | RomaineCommands;

export interface ModeAction {
  type: "MODE";
  payload: RomaineModes;
}
export interface AngleAction {
  type: "ANGLE";
  payload: number;
}
export interface ScaleAction {
  type: "SCALE";
  payload: {
    width: number;
    height: number;
  };
}
export interface HistoryAction {
  type: "HISTORY";
  payload: { cmd: "PUSH" | "CLEAR" | "UNDO" | "REDO" };
}
export interface CropPointsAction {
  type: "CROP_POINTS";
  payload: ContourCoordinates | undefined;
}
export type RomaineReducer =
  | {
      type: "JOIN_PAYLOAD" | "REMOVE_CROPPER";
      payload?: any;
    }
  | ModeAction
  | AngleAction
  | ScaleAction
  | HistoryAction
  | CropPointsAction;
export const romaineReducer = (
  state: RomaineState,
  action: RomaineReducer
): RomaineState => {
  switch (action.type) {
    case "JOIN_PAYLOAD":
      return { ...state, ...action.payload };
    case "MODE":
      if (state.mode === action.payload) return { ...state, mode: null };
      return { ...state, mode: action.payload };
    case "ANGLE":
      return { ...state, angle: action.payload };
    case "SCALE":
      return { ...state, scale: action.payload };
    case "CROP_POINTS":
      if (!action.payload) return { ...state };
      return { ...state, cropPoints: action.payload };
    case "HISTORY":
      return { ...history(state, action.payload) };
    default:
      return { ...state };
  }
};
