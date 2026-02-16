export interface MlMaskState {
  /** The original image before any background removal (full-quality PNG Blob) */
  originalBlob: Blob;
  /** Full-res mask as ImageData — alpha channel holds mask values (0=bg, 255=fg) */
  maskImageData: ImageData;
  /** Tracks user corrections: 0=untouched, 1=definite-fg, 2=definite-bg */
  userCorrections: Uint8Array;
  width: number;
  height: number;
}

let state: MlMaskState | null = null;

export const getMlMaskState = (): MlMaskState | null => state;
export const hasMlMask = (): boolean => state !== null;
export const setMlMaskState = (s: MlMaskState): void => {
  state = s;
};
export const clearMlMaskState = (): void => {
  state = null;
};
