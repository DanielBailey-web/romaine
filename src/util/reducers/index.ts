import { RomaineModes } from "./cropperReducer";

export interface RomaineState {
  mode: RomaineModes;
}
export const initialRomaineState: RomaineState = {
  mode: null,
};

export * from "./cropperReducer";
