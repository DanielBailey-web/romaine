export type ProgressCallback = (
  key: string,
  current: number,
  total: number
) => void;

export type ModelType = "isnet" | "isnet_fp16" | "isnet_quint8";

export interface RemoveBgOptions {
  /** Model to use. "isnet" = full quality, "isnet_fp16" = half precision, "isnet_quint8" = quantized (smallest). Default: "isnet_fp16" */
  model?: ModelType;
  progress?: ProgressCallback;
}

export async function removeBg(
  blob: Blob,
  opts: RemoveBgOptions = {}
): Promise<Blob> {
  // Dynamic import so @imgly/background-removal is only loaded when needed,
  // not eagerly on page start (it's ~40-80MB with ONNX/WASM).
  const { removeBackground } = await import("@imgly/background-removal");
  return removeBackground(blob, {
    model: opts.model ?? "isnet_fp16",
    progress: opts.progress,
    output: { format: "image/png", quality: 0.9 },
  });
}

/** Returns the raw segmentation mask as a white-on-transparent PNG.
 *  The alpha channel holds the mask values (0=bg, 255=fg). */
export async function segmentFg(
  blob: Blob,
  opts: RemoveBgOptions = {}
): Promise<Blob> {
  const { segmentForeground } = await import("@imgly/background-removal");
  return segmentForeground(blob, {
    model: opts.model ?? "isnet_fp16",
    progress: opts.progress,
    output: { format: "image/png", quality: 1 },
  });
}
