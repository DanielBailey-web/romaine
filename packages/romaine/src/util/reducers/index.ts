import type { ContourCoordinates } from "../../components";
import type { RomaineModes, RomaineCommands } from "./romaineReducer";
export interface RomaineHistory {
  cmd: RomaineCommands;
  payload: any;
}

export interface RomaineState {
  mode: RomaineModes;
  angle: number;
  cropPoints: ContourCoordinates;
  /** A command and a payload.
   * The payload is automatically generated based on current state
   * (e.g. angle of rotation, crop point locations)
   */
  history: { commands: RomaineHistory[]; pointer: number };
}
export const initialRomaineState: RomaineState = {
  mode: null,
  angle: 90,
  history: { commands: [], pointer: 0 },
  cropPoints: {
    "left-top": { x: 0, y: 0 },
    "left-bottom": { x: 0, y: 0 },
    "right-bottom": { x: 0, y: 0 },
    "right-top": { x: 0, y: 0 },
  },
};

export type SetCropPoints = (
  cropPoints:
    | undefined
    | ContourCoordinates
    | ((CPs?: ContourCoordinates) => ContourCoordinates | undefined)
) => void;
export * from "./romaineReducer";
export * from "./history";
