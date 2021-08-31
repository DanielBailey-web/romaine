import { RomaineState } from ".";
export type RomaineModes =
  | null
  | "crop"
  | "perspective-crop"
  | "rotate-right"
  | "rotate-left"
  | "full-reset";

export type CropperReducer =
  | {
      type: "JOIN_PAYLOAD" | "REMOVE_CROPPER";
      payload?: any;
    }
  | {
      type: "MODE";
      payload: RomaineModes;
    };
export const cropperReducer = (state: RomaineState, action: CropperReducer) => {
  switch (action.type) {
    case "JOIN_PAYLOAD":
      return { ...state, ...action.payload };
    case "MODE":
      if (state.mode === action.payload) return { ...state, mode: null };
      return { ...state, mode: action.payload };
    default:
      return { ...state };
  }
};
