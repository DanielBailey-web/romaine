import { useCallback, useEffect, useRef, useState } from "react";
import { useRomaine } from "romaine";
import { getMlMaskState, hasMlMask } from "./mlMaskState";
import { compositeWithMask } from "./maskUtils";

interface BrushStroke {
  points: Array<{ x: number; y: number }>;
  mode: "fg" | "bg";
  brushSize: number;
}

const DEFAULT_BRUSH_SIZE = 20;
const MIN_BRUSH_SIZE = 5;
const MAX_BRUSH_SIZE = 100;

export const MlBrushCanvas = () => {
  const { setMode, pushHistory, canvasApi } = useRomaine();
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [brushMode, setBrushMode] = useState<"fg" | "bg">("fg");
  const [isDrawing, setIsDrawing] = useState(false);
  const strokesRef = useRef<BrushStroke[]>([]);
  const currentStrokeRef = useRef<BrushStroke | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  // Draggable toolbar state
  const [toolbarPos, setToolbarPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const toolbarDrag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Guard: exit if no mask
  useEffect(() => {
    if (!hasMlMask()) {
      console.warn("No ML mask available. Run ML Remove Background first.");
      setMode?.(null);
    }
  }, [setMode]);

  // Measure container dimensions
  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ghost layer: show original image at low opacity
  useEffect(() => {
    const state = getMlMaskState();
    const ghost = ghostRef.current;
    if (!state || !ghost || !dims.width) return;

    const url = URL.createObjectURL(state.originalBlob);
    const img = new Image();
    img.onload = () => {
      ghost.width = dims.width;
      ghost.height = dims.height;
      const ctx = ghost.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, dims.width, dims.height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [dims]);

  // Redraw strokes + cursor
  const redraw = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = [...strokesRef.current];
    if (currentStrokeRef.current) allStrokes.push(currentStrokeRef.current);

    for (const stroke of allStrokes) {
      ctx.fillStyle =
        stroke.mode === "fg"
          ? "rgba(0, 200, 0, 0.35)"
          : "rgba(200, 0, 0, 0.35)";
      const r = stroke.brushSize / 2;
      for (const pt of stroke.points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (mousePos.current) {
      ctx.beginPath();
      ctx.arc(
        mousePos.current.x,
        mousePos.current.y,
        brushSize / 2,
        0,
        Math.PI * 2
      );
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
        setMode?.("preview");
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
    setBrushSize((prev) =>
      Math.min(MAX_BRUSH_SIZE, Math.max(MIN_BRUSH_SIZE, prev + delta))
    );
  }, []);

  // Apply: paint strokes onto mask alpha, recomposite
  const handleApply = useCallback(async () => {
    const state = getMlMaskState();
    if (!state || strokesRef.current.length === 0) return;

    const ratio = dims.width / state.width;
    const maskData = state.maskImageData.data;
    const corrections = state.userCorrections;

    for (const stroke of strokesRef.current) {
      const alphaValue = stroke.mode === "fg" ? 255 : 0;
      const correctionValue = stroke.mode === "fg" ? 1 : 2;
      for (const pt of stroke.points) {
        const mx = Math.round(pt.x / ratio);
        const my = Math.round(pt.y / ratio);
        const r = Math.max(1, Math.round(stroke.brushSize / 2 / ratio));
        const rSq = r * r;
        const yMin = Math.max(0, my - r);
        const yMax = Math.min(state.height - 1, my + r);
        const xMin = Math.max(0, mx - r);
        const xMax = Math.min(state.width - 1, mx + r);
        for (let py = yMin; py <= yMax; py++) {
          for (let px = xMin; px <= xMax; px++) {
            const dx = px - mx;
            const dy = py - my;
            if (dx * dx + dy * dy <= rSq) {
              const idx = py * state.width + px;
              maskData[idx * 4 + 3] = alphaValue;
              corrections[idx] = correctionValue;
            }
          }
        }
      }
    }

    const result = await compositeWithMask(
      state.originalBlob,
      state.maskImageData
    );
    const api = canvasApi.current;
    if (api) {
      await api.setFromBlob(result);
      pushHistory?.(result);
    }

    strokesRef.current = [];
    setMode?.("preview");
  }, [dims, canvasApi, pushHistory, setMode]);

  // Re-run ML: trigger the rerun mode
  const handleRerunMl = useCallback(() => {
    setMode?.("ml-refine-rerun");
  }, [setMode]);

  const handleCancel = useCallback(() => {
    strokesRef.current = [];
    setMode?.("preview");
  }, [setMode]);

  return (
    <div ref={containerRef}>
      {/* Ghost canvas: faded original image */}
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
      {/* Overlay canvas for stroke feedback */}
      <canvas
        ref={overlayRef}
        width={dims.width}
        height={dims.height}
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
      {/* Event capture div */}
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
      {/* Floating toolbar */}
      <div
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
          if (
            (e.target as HTMLElement).tagName === "BUTTON" ||
            (e.target as HTMLElement).tagName === "INPUT"
          )
            return;
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          const rect = e.currentTarget.getBoundingClientRect();
          const parentRect =
            e.currentTarget.offsetParent?.getBoundingClientRect() ?? rect;
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
          onClick={handleRerunMl}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Re-run ML
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
    </div>
  );
};
