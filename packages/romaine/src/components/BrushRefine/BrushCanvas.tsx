import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRomaine } from "../../hooks";
import { ImagePtr, ShowPreview, SetPreviewPaneDimensions, size } from "../../types";
import { CalculatedDimensions } from "../../util";
import {
  hasGrabCutMask,
  getGrabCutScaleFactor,
  setLastAppliedStrokes,
  refineBackground,
  BrushStrokeData,
} from "../../util/image/removeBackground";

interface BrushStroke {
  points: Array<{ x: number; y: number }>;
  mode: "fg" | "bg";
  brushSize: number;
}

export interface BrushCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | undefined>;
  canvasPtr: React.RefObject<ImagePtr>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  previewDims: CalculatedDimensions | undefined;
  imageResizeRatio: number;
  showPreview: ShowPreview;
  setPreviewPaneDimensions: SetPreviewPaneDimensions;
}

const DEFAULT_BRUSH_SIZE = 20;
const MIN_BRUSH_SIZE = 5;
const MAX_BRUSH_SIZE = 100;

export const BrushCanvas = ({
  canvasRef,
  canvasPtr,
  previewDims,
  imageResizeRatio,
  showPreview,
  setPreviewPaneDimensions,
}: BrushCanvasProps) => {
  const { cv, setMode, pushHistory } = useRomaine();
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [brushMode, setBrushMode] = useState<"fg" | "bg">("fg");
  const [isDrawing, setIsDrawing] = useState(false);
  const strokesRef = useRef<BrushStroke[]>([]);
  const currentStrokeRef = useRef<BrushStroke | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const toolbarDrag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Guard: exit if no mask is available
  useEffect(() => {
    if (!hasGrabCutMask()) {
      console.warn("No background removal mask. Run Remove Background first.");
      setMode?.(null);
    }
  }, [setMode]);

  // Ghost layer: show the full image (including removed areas) at low opacity
  useEffect(() => {
    const ghost = ghostRef.current;
    const mat = canvasPtr.current;
    if (!ghost || !mat || !previewDims) return;

    const fullW = mat.cols;
    const fullH = mat.rows;

    // Create offscreen canvas at full resolution with all alpha = 255
    const offscreen = document.createElement("canvas");
    offscreen.width = fullW;
    offscreen.height = fullH;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const data = (mat as any).data as Uint8Array;
    const imgData = offCtx.createImageData(fullW, fullH);
    const pixels = imgData.data;
    for (let i = 0; i < fullW * fullH; i++) {
      pixels[i * 4] = data[i * 4];
      pixels[i * 4 + 1] = data[i * 4 + 1];
      pixels[i * 4 + 2] = data[i * 4 + 2];
      pixels[i * 4 + 3] = 255; // force full alpha
    }
    offCtx.putImageData(imgData, 0, 0);

    // Draw scaled to the ghost canvas at preview dimensions
    ghost.width = previewDims.width;
    ghost.height = previewDims.height;
    const gCtx = ghost.getContext("2d");
    if (!gCtx) return;
    gCtx.drawImage(offscreen, 0, 0, previewDims.width, previewDims.height);
  }, [canvasPtr, previewDims]);

  const width = previewDims?.width ?? 0;
  const height = previewDims?.height ?? 0;

  // Redraw all strokes + cursor on overlay canvas
  const redraw = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed strokes
    const allStrokes = [...strokesRef.current];
    if (currentStrokeRef.current) allStrokes.push(currentStrokeRef.current);

    for (const stroke of allStrokes) {
      ctx.fillStyle =
        stroke.mode === "fg" ? "rgba(0, 200, 0, 0.35)" : "rgba(200, 0, 0, 0.35)";
      const r = stroke.brushSize / 2;
      for (const pt of stroke.points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw cursor
    if (mousePos.current) {
      ctx.beginPath();
      ctx.arc(mousePos.current.x, mousePos.current.y, brushSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = brushMode === "fg" ? "#0f0" : "#f00";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [brushSize, brushMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "x" || e.key === "X") {
        setBrushMode((prev) => (prev === "fg" ? "bg" : "fg"));
      }
      if (e.key === "[") {
        setBrushSize((prev) => Math.max(MIN_BRUSH_SIZE, prev - 5));
      }
      if (e.key === "]") {
        setBrushSize((prev) => Math.min(MAX_BRUSH_SIZE, prev + 5));
      }
      if (e.key === "Escape") {
        setMode?.(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setMode]);

  const getPos = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const pos = getPos(e);
      setIsDrawing(true);
      currentStrokeRef.current = {
        points: [pos],
        mode: brushMode,
        brushSize,
      };
      mousePos.current = pos;
      redraw();
    },
    [brushMode, brushSize, redraw]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pos = getPos(e);
      mousePos.current = pos;
      if (isDrawing && currentStrokeRef.current) {
        currentStrokeRef.current.points.push(pos);
      }
      redraw();
    },
    [isDrawing, redraw]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    if (currentStrokeRef.current) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
    redraw();
  }, [redraw]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -3 : 3;
    setBrushSize((prev) => Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prev + delta)));
  }, []);

  const handleApply = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    if (!canvasPtr.current || !canvasRef.current) return;

    const sf = getGrabCutScaleFactor();
    // Convert strokes from preview coords to mask coords
    const maskStrokes: BrushStrokeData[] = strokesRef.current.map((s) => ({
      points: s.points.map((p) => ({
        x: Math.round((p.x / imageResizeRatio) * sf),
        y: Math.round((p.y / imageResizeRatio) * sf),
      })),
      mode: s.mode,
      brushRadius: Math.max(1, Math.round((s.brushSize / 2 / imageResizeRatio) * sf)),
    }));

    // Store for history, push history, then apply
    setLastAppliedStrokes(maskStrokes);
    pushHistory?.();
    refineBackground(cv, canvasRef.current, canvasPtr.current, maskStrokes);

    // Update preview
    const dims: size = {
      width: canvasPtr.current.cols,
      height: canvasPtr.current.rows,
    };
    const irr = setPreviewPaneDimensions(dims);
    showPreview(irr, canvasPtr.current, false);

    // Clear strokes and exit
    strokesRef.current = [];
    setMode?.("preview");
  }, [
    canvasPtr,
    canvasRef,
    cv,
    imageResizeRatio,
    pushHistory,
    setMode,
    setPreviewPaneDimensions,
    showPreview,
  ]);

  const handleCancel = useCallback(() => {
    strokesRef.current = [];
    setMode?.(null);
  }, [setMode]);

  return (
    <>
      {/* Ghost canvas: faded full image behind the preview */}
      <canvas
        ref={ghostRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 4,
          pointerEvents: "none",
          opacity: 0.3,
        }}
      />
      {/* Overlay canvas for painting visual feedback */}
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      />
      {/* Event-capture div */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9,
          cursor: "crosshair",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          mousePos.current = null;
          redraw();
        }}
        onWheel={handleWheel}
      />
      {/* Floating draggable toolbar */}
      <div
        ref={toolbarRef}
        style={{
          position: "absolute",
          ...(toolbarPos
            ? { left: toolbarPos.x, top: toolbarPos.y }
            : { bottom: 10, left: "50%", transform: "translateX(-50%)" }),
          zIndex: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(0,0,0,0.8)",
          borderRadius: 8,
          padding: "6px 12px",
          color: "#fff",
          fontSize: 13,
          userSelect: "none",
          whiteSpace: "nowrap",
          cursor: "grab",
        }}
        onPointerDown={(e) => {
          // Only start drag from the toolbar background, not from buttons/inputs
          if ((e.target as HTMLElement).tagName === "BUTTON" || (e.target as HTMLElement).tagName === "INPUT") return;
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          const rect = e.currentTarget.getBoundingClientRect();
          const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect() ?? rect;
          toolbarDrag.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: rect.left - parentRect.left,
            origY: rect.top - parentRect.top,
          };
        }}
        onPointerMove={(e) => {
          if (!toolbarDrag.current) return;
          e.stopPropagation();
          const dx = e.clientX - toolbarDrag.current.startX;
          const dy = e.clientY - toolbarDrag.current.startY;
          setToolbarPos({
            x: toolbarDrag.current.origX + dx,
            y: toolbarDrag.current.origY + dy,
          });
        }}
        onPointerUp={(e) => {
          if (toolbarDrag.current) {
            e.stopPropagation();
            toolbarDrag.current = null;
          }
        }}
      >
        <button
          onClick={() => setBrushMode((p) => (p === "fg" ? "bg" : "fg"))}
          style={{
            background: brushMode === "fg" ? "#2e7d32" : "#c62828",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {brushMode === "fg" ? "+ Foreground" : "- Background"} (X)
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          Size:
          <input
            type="range"
            min={MIN_BRUSH_SIZE}
            max={MAX_BRUSH_SIZE}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: 80 }}
          />
          <span style={{ minWidth: 24, textAlign: "right" }}>{brushSize}</span>
        </label>
        <button
          onClick={handleApply}
          style={{
            background: "#4caf50",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: "bold",
          }}
        >
          Apply
        </button>
        <button
          onClick={handleCancel}
          style={{
            background: "#555",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
};
