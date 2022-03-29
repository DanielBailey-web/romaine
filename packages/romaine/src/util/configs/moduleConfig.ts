export interface ModuleConfig {
  wasmBinaryFile: string;
  usingWasm: boolean;
  onRuntimeInitialized?: () => void;
}

export const moduleConfig: ModuleConfig = {
  wasmBinaryFile: "opencv_js.wasm",
  usingWasm: true,
};
