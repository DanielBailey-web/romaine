import { initialRomaineState } from ".";

export interface CropperReducer {
  type: "JOIN_PAYLOAD" | "REMOVE_CROPPER";
  payload?: any;
}
export const cropperReducer = (
  state: typeof initialRomaineState,
  action: CropperReducer
) => {
  if (action.type === "JOIN_PAYLOAD") return { ...state, ...action.payload };
  return { ...state };
};
