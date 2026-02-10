import { ImagePtr, OpenCV } from "../../types";

const MAX_GRABCUT_DIM = 800;

// --- Module-level GrabCut state storage ---
let storedMask: ImagePtr | null = null;
let storedBgdModel: ImagePtr | null = null;
let storedFgdModel: ImagePtr | null = null;
let storedScaleFactor = 1;
let storedSmallW = 0;
let storedSmallH = 0;
let lastAppliedStrokes: BrushStrokeData[] = [];

export interface BrushStrokeData {
  points: Array<{ x: number; y: number }>;
  mode: "fg" | "bg";
  brushRadius: number;
}

export const clearGrabCutState = () => {
  try { storedMask?.delete(); } catch { /* noop */ }
  try { storedBgdModel?.delete(); } catch { /* noop */ }
  try { storedFgdModel?.delete(); } catch { /* noop */ }
  storedMask = null;
  storedBgdModel = null;
  storedFgdModel = null;
  storedScaleFactor = 1;
  storedSmallW = 0;
  storedSmallH = 0;
  lastAppliedStrokes = [];
};

export const hasGrabCutMask = (): boolean => storedMask !== null;
export const getGrabCutScaleFactor = (): number => storedScaleFactor;
export const getGrabCutDims = (): { w: number; h: number } => ({
  w: storedSmallW,
  h: storedSmallH,
});
export const setLastAppliedStrokes = (s: BrushStrokeData[]) => {
  lastAppliedStrokes = s;
};
export const getLastAppliedStrokes = (): BrushStrokeData[] => lastAppliedStrokes;

/**
 * Shared pipeline: convert raw GrabCut mask to binary, apply morphology,
 * blur, upscale, and write to src alpha channel.
 */
const applyMaskToAlpha = (
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr,
  rawMask: ImagePtr,
  origW: number,
  origH: number,
  scaleFactor: number
) => {
  const mats: ImagePtr[] = [];
  const del = (m: ImagePtr) => { mats.push(m); return m; };

  try {
    // Clone so we don't modify the stored mask
    const binMask = del(rawMask.clone());
    const maskData = (binMask as any).data as Uint8Array;
    for (let i = 0; i < maskData.length; i++) {
      maskData[i] = (maskData[i] === 1 || maskData[i] === 3) ? 255 : 0;
    }

    // Morphological cleanup if available
    const hasMorphology =
      typeof (cv as any).getStructuringElement === "function" &&
      typeof (cv as any).morphologyEx === "function";

    if (hasMorphology) {
      const kernel = del(
        (cv as any).getStructuringElement(
          (cv as any).MORPH_ELLIPSE,
          new cv.Size(5, 5)
        )
      );
      (cv as any).morphologyEx(binMask, binMask, (cv as any).MORPH_CLOSE, kernel);
      (cv as any).morphologyEx(binMask, binMask, (cv as any).MORPH_OPEN, kernel);
    }

    // Edge feathering
    const blurred = del(new cv.Mat());
    cv.GaussianBlur(binMask, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // Upscale mask back to original dimensions
    let finalMask: ImagePtr;
    if (scaleFactor < 1) {
      finalMask = del(new cv.Mat());
      cv.resize(blurred, finalMask, new cv.Size(origW, origH), 0, 0, cv.INTER_LINEAR);
    } else {
      finalMask = blurred;
    }

    // Apply mask as alpha channel
    const srcData = (src as any).data as Uint8Array;
    const finalMaskData = (finalMask as any).data as Uint8Array;
    const totalPixels = origW * origH;
    for (let i = 0; i < totalPixels; i++) {
      srcData[i * 4 + 3] = finalMaskData[i];
    }

    cv.imshow(canvas, src);
  } finally {
    for (const m of mats) {
      try { m.delete(); } catch { /* noop */ }
    }
  }
};

/**
 * Remove the background from an image using OpenCV's GrabCut algorithm.
 * Stores the GrabCut mask for subsequent refinement via refineBackground().
 */
export const removeBackground = (
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr
) => {
  if (!cv.grabCut) {
    throw new Error("cv.grabCut is not available in this OpenCV build");
  }

  // Clear any previous stored state
  clearGrabCutState();

  const origW = src.cols;
  const origH = src.rows;
  const maxDim = Math.max(origW, origH);
  const sf = maxDim > MAX_GRABCUT_DIM ? MAX_GRABCUT_DIM / maxDim : 1;
  const sW = Math.round(origW * sf);
  const sH = Math.round(origH * sf);

  const mats: ImagePtr[] = [];
  const del = (m: ImagePtr) => { mats.push(m); return m; };

  try {
    // Downscale if needed
    let small: ImagePtr;
    if (sf < 1) {
      small = del(new cv.Mat());
      cv.resize(src, small, new cv.Size(sW, sH), 0, 0, cv.INTER_AREA);
    } else {
      small = del(src.clone());
    }

    const rgb = del(new cv.Mat());
    cv.cvtColor(small, rgb, cv.COLOR_RGBA2RGB, 0);

    const mask = del(new cv.Mat());
    const bgdModel = del(new cv.Mat());
    const fgdModel = del(new cv.Mat());

    const insetX = Math.max(1, Math.floor(sW * 0.03));
    const insetY = Math.max(1, Math.floor(sH * 0.03));
    const rect = new cv.Rect(insetX, insetY, sW - insetX * 2, sH - insetY * 2);

    // Pass 1: rectangle init
    cv.grabCut(rgb, mask, rect, bgdModel, fgdModel, 5, cv.GC_INIT_WITH_RECT);
    // Pass 2: mask refinement
    cv.grabCut(rgb, mask, rect, bgdModel, fgdModel, 3, (cv as any).GC_INIT_WITH_MASK ?? 1);

    // Store mask & models for future refinement (before binary conversion)
    storedMask = mask.clone();
    storedBgdModel = bgdModel.clone();
    storedFgdModel = fgdModel.clone();
    storedScaleFactor = sf;
    storedSmallW = sW;
    storedSmallH = sH;

    // Apply the mask to the image
    applyMaskToAlpha(cv, canvas, src, mask, origW, origH, sf);
  } finally {
    for (const m of mats) {
      try { m.delete(); } catch { /* noop */ }
    }
  }
};

/**
 * Refine the background removal using user-supplied brush strokes.
 * Strokes mark pixels as definite foreground or background, then
 * GrabCut re-runs with GC_INIT_WITH_MASK.
 */
export const refineBackground = (
  cv: OpenCV,
  canvas: HTMLCanvasElement,
  src: ImagePtr,
  strokes: BrushStrokeData[]
) => {
  if (!storedMask || !storedBgdModel || !storedFgdModel) {
    throw new Error("No GrabCut mask available. Run removeBackground first.");
  }
  if (!strokes || strokes.length === 0) return;

  const origW = src.cols;
  const origH = src.rows;

  const mats: ImagePtr[] = [];
  const del = (m: ImagePtr) => { mats.push(m); return m; };

  try {
    // Downscale current image for GrabCut
    let small: ImagePtr;
    if (storedScaleFactor < 1) {
      small = del(new cv.Mat());
      cv.resize(src, small, new cv.Size(storedSmallW, storedSmallH), 0, 0, cv.INTER_AREA);
    } else {
      small = del(src.clone());
    }

    const rgb = del(new cv.Mat());
    cv.cvtColor(small, rgb, cv.COLOR_RGBA2RGB, 0);

    // Clone the stored mask and paint user strokes onto it
    const refineMask = del(storedMask.clone());
    const maskData = (refineMask as any).data as Uint8Array;

    for (const stroke of strokes) {
      const gcValue = stroke.mode === "fg" ? 1 : 0; // GC_FGD=1, GC_BGD=0
      for (const pt of stroke.points) {
        const r = stroke.brushRadius;
        const rSq = r * r;
        const yMin = Math.max(0, pt.y - r);
        const yMax = Math.min(storedSmallH - 1, pt.y + r);
        const xMin = Math.max(0, pt.x - r);
        const xMax = Math.min(storedSmallW - 1, pt.x + r);
        for (let my = yMin; my <= yMax; my++) {
          const dy = my - pt.y;
          for (let mx = xMin; mx <= xMax; mx++) {
            const dx = mx - pt.x;
            if (dx * dx + dy * dy <= rSq) {
              maskData[my * storedSmallW + mx] = gcValue;
            }
          }
        }
      }
    }

    // Re-run GrabCut with user-updated mask
    const dummyRect = new cv.Rect(0, 0, 1, 1);
    cv.grabCut(
      rgb, refineMask, dummyRect,
      storedBgdModel, storedFgdModel,
      3, (cv as any).GC_INIT_WITH_MASK ?? 1
    );

    // Update stored mask with refined result
    storedMask.delete();
    storedMask = refineMask.clone();

    // Apply the refined mask to the image
    applyMaskToAlpha(cv, canvas, src, refineMask, origW, origH, storedScaleFactor);
  } finally {
    for (const m of mats) {
      try { m.delete(); } catch { /* noop */ }
    }
  }
};
