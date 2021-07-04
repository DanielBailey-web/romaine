type RomaineModes =
  | null
  | "crop"
  | "perspective-crop"
  | "rotate-right"
  | "rotate-left";

export interface RomaineState {
  mode: RomaineModes;
}
export const initialRomaineState: RomaineState = {
  mode: null,
};

export * from "./cropperReducer";
