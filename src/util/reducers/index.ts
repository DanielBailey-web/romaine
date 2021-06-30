type RomaineModes = null | "crop" | "perspective-crop";

export interface RomaineState {
  mode: RomaineModes;
}
export const initialRomaineState: RomaineState = {
  mode: null,
};

export * from "./cropperReducer";
