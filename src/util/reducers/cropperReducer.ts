import { RomaineState } from ".";

export interface CropperReducer {
  type: "JOIN_PAYLOAD" | "REMOVE_CROPPER" | "MODE";
  payload?: any;
}
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
