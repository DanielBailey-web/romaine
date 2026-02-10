export interface OpenCVFilterProps {
  blur: boolean;
  th: boolean;
  thMode: any;
  thMeanCorrection: number;
  thBlockSize: number;
  thMax: number;
  grayScale: boolean;
}
type _$$ = {
  count: { value: number };
  ptr: number;
  ptrType: {
    destructorFunction: unknown | undefined | null;
    isConst: boolean;
    isReference: boolean;
    isSmartPointer: boolean;
    name: "string";
    pointeeType: unknown;
    rawConstructor: unknown;
    rawDestructor: unknown;
    rawGetPointee: unknown;
    rawShare: unknown;
  };
};
type MatPtr = {
  $$: _$$;
  delete(): void;
  matSize: [number, number];
  cols: number;
  rows: number;
  size: () => size;
  copyTo: (dst: ImagePtr) => void;
  clone: () => ImagePtr;
};
export type ImagePtr = MatPtr & {
  data64F: number[];
  $$: _$$;
};
// declare class Size {
//   width: number;
//   height: number;
//   constructor(width: number, height: number);
// }
export interface size {
  width: number;
  height: number;
}
interface Size {
  new (width: number, height: number): size;
  Size: Size;
}
interface Mat {
  new (): MatPtr & ImagePtr;
  /**
   * Create an identity matrix
   */
  eye: (cols: number, rows: number, type: number) => MatPtr;
  Mat: Mat;
}
interface point {
  x: number;
  y: number;
}
interface Point {
  new (x: number, y: number): point;
  Point: Point;
}
interface Scalar {
  new (): unknown;
  Scalar: Scalar;
}
type MatrixVector = Pick<ImagePtr, "delete">;
interface MatVector {
  new (): MatrixVector;
  MatVector: MatVector;
}
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface RectConstructor {
  new (x: number, y: number, width: number, height: number): Rect;
  Rect: RectConstructor;
}
interface CV_Types {
  INTER_LINEAR: number;
  INTER_NEAREST: number;
  INTER_AREA: 3;
  RETR_CCOMP: number;
  CHAIN_APPROX_SIMPLE: number;
  BORDER_DEFAULT: number;
  BORDER_CONSTANT: number;
  CV_32F: 5;
  CV_32FC1: 5;
  CV_32FC2: number;
  CV_64FC1: 6;
  CV_8UC1: number;
  COLOR_RGBA2GRAY: 11;
  COLOR_RGBA2RGB: number;
  COLOR_RGB2RGBA: number;
  COLOR_BGR2HSV: 40;
  COLOR_RGBA2BGRA: 5;
  THRESH_BINARY: number;
  ADAPTIVE_THRESH_MEAN_C: number;
  CV_8U: 0;
  GC_BGD: 0;
  GC_FGD: 1;
  GC_PR_BGD: 2;
  GC_PR_FGD: 3;
  GC_INIT_WITH_RECT: 0;
  GC_INIT_WITH_MASK: 1;
}
export type OpenCV = CV_Types & {
  imread: (canvas: HTMLCanvasElement) => ImagePtr;
  imshow: (canvas: HTMLCanvasElement, image: ImagePtr) => void;
  resize: (...args: any[]) => ImagePtr;
  getRotationMatrix2D: (point: point, angle: number, dunno: number) => ImagePtr;
  adaptiveThreshold: (src: ImagePtr, dst: ImagePtr, ...args: any[]) => void;
  Canny: (
    src: ImagePtr,
    dest: ImagePtr,
    threshold1: number,
    threshold2: number
  ) => void;
  matFromArray: (
    cols: number,
    rows: number,
    type: number,
    values: number[]
  ) => MatPtr;
  transform: (src: ImagePtr, dst: ImagePtr, mat: MatPtr) => void;
  filter2D: (
    /**	input image.  */
    src: ImagePtr,
    /**	output image of the same size and the same number of channels as src.  */
    dst: ImagePtr,
    /**	desired depth of the destination image.  */
    ddepth: number,
    /**convolution kernel (or rather a correlation kernel), a single-channel floating point matrix;
     * if you want to apply different kernels to different channels,
     * split the image into separate color planes using split and process them individually.  */
    kernel: MatPtr,
    /**anchor of the kernel that indicates the relative position of a filtered point within the kernel;
     * the anchor should lie within the kernel;
     * default value new cv.Point(-1, -1) means that the anchor is at the kernel center.  */
    anchor?: point,
    /**optional value added to the filtered pixels before storing them in dst.  */
    delta?: number,
    /**pixel extrapolation method */
    borderType?: number
  ) => void;
  // can probably do better if I log the object
  boundingRect: (src: ImagePtr) => Record<string, number>;
  warpAffine: (src: ImagePtr, dest: ImagePtr, ...args: any[]) => void;
  findContours: (
    src: ImagePtr,
    mat_vec: MatrixVector,
    mat: ImagePtr,
    something2: number,
    something3: number
  ) => void;
  cvtColor: (
    src: ImagePtr,
    dest: ImagePtr,
    something1: number,
    something2: number
  ) => void;
  warpPerspective: (src: ImagePtr, dest: ImagePtr, ...args: any[]) => void;
  threshold: (
    src: ImagePtr,
    dest: ImagePtr,
    thresh1: number,
    thresh2: number,
    option: number
  ) => void;
  GaussianBlur: (
    src: ImagePtr,
    dest: ImagePtr,
    size: size,
    num1: number,
    num2: number,
    num3: number
  ) => void;
  getPerspectiveTransform: (mat1: any, mat2: any) => any;
  flip: (src: ImagePtr, dest: ImagePtr, num: number) => void;
  grabCut: (
    src: ImagePtr,
    mask: ImagePtr,
    rect: Rect,
    bgdModel: ImagePtr,
    fgdModel: ImagePtr,
    iterCount: number,
    mode: number
  ) => void;
  split: (src: ImagePtr, channels: MatrixVector) => void;
  merge: (channels: MatrixVector, dst: ImagePtr) => void;
  Size: Size;
  Mat: Mat;
  Point: Point;
  Scalar: Scalar;
  MatVector: MatVector;
  Rect: RectConstructor;
};
