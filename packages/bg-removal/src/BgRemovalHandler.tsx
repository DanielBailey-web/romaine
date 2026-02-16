import { useEffect, useRef, useState, useCallback } from "react";
import { useRomaine } from "romaine";
import { segmentFg, ModelType } from "./removeBg";
import {
  getMlMaskState,
  setMlMaskState,
  hasMlMask,
} from "./mlMaskState";
import { extractMaskFromBlob, compositeWithMask } from "./maskUtils";
import { MlBrushCanvas } from "./MlBrushCanvas";

export interface BgRemovalHandlerProps {
  model?: ModelType;
}

/** Waits for canvasApi to be populated (sibling effect ordering). */
async function waitForApi(
  canvasApi: React.MutableRefObject<{
    getBlob: (opts?: any) => Promise<Blob | null>;
    setFromBlob: (blob: Blob) => Promise<void>;
  } | null>
) {
  let api = canvasApi.current;
  if (!api) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 50));
      api = canvasApi.current;
      if (api) break;
    }
  }
  if (!api) throw new Error("Canvas not ready");
  return api;
}

export const BgRemovalHandler = ({
  model = "isnet_fp16",
}: BgRemovalHandlerProps) => {
  const {
    canvasApi,
    romaine: { mode },
    setMode,
    pushHistory,
  } = useRomaine();

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const handleProgress = useCallback(
    (_key: string, current: number, total: number) => {
      if (total > 0) setProgress(Math.round((current / total) * 100));
    },
    []
  );

  // --- Mode: ml-remove-background (initial ML removal) ---
  useEffect(() => {
    if (mode !== "ml-remove-background" || processing) return;

    const run = async () => {
      abortRef.current = false;
      setProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const api = await waitForApi(canvasApi);

        const originalBlob = await api.getBlob({
          type: "image/png",
          quality: 1,
        });
        if (!originalBlob) throw new Error("Failed to read canvas");
        if (abortRef.current) return;

        // Single inference pass: get the raw mask
        const maskBlob = await segmentFg(originalBlob, {
          model,
          progress: handleProgress,
        });
        if (abortRef.current) return;

        // Extract mask as ImageData and store state for refinement
        const maskImageData = await extractMaskFromBlob(maskBlob);
        const { width, height } = maskImageData;
        setMlMaskState({
          originalBlob,
          maskImageData,
          userCorrections: new Uint8Array(width * height),
          width,
          height,
        });

        // Composite original + mask locally (no second inference)
        const result = await compositeWithMask(originalBlob, maskImageData);
        if (abortRef.current) return;

        await api.setFromBlob(result);
        pushHistory?.(result);
        setMode?.("preview");
      } catch (err) {
        if (!abortRef.current) {
          setError(
            err instanceof Error ? err.message : "Background removal failed"
          );
          setTimeout(() => {
            setError(null);
            setMode?.(null);
          }, 3000);
        }
      } finally {
        setProcessing(false);
      }
    };

    run();
  }, [mode, processing, canvasApi, model, handleProgress, pushHistory, setMode]);

  // --- Mode: ml-refine-rerun (re-run ML with user corrections merged) ---
  useEffect(() => {
    if (mode !== "ml-refine-rerun" || processing) return;

    const run = async () => {
      const state = getMlMaskState();
      if (!state) {
        setMode?.("preview");
        return;
      }

      abortRef.current = false;
      setProcessing(true);
      setProgress(0);
      setError(null);

      try {
        const api = await waitForApi(canvasApi);

        // Re-run ML on the original (pristine) image
        const freshMaskBlob = await segmentFg(state.originalBlob, {
          model,
          progress: handleProgress,
        });
        if (abortRef.current) return;

        const freshMask = await extractMaskFromBlob(freshMaskBlob);
        const freshData = freshMask.data;
        const corrections = state.userCorrections;

        // Merge user corrections onto the fresh ML mask
        for (let i = 0; i < state.width * state.height; i++) {
          if (corrections[i] === 1) {
            freshData[i * 4 + 3] = 255; // definite foreground
          } else if (corrections[i] === 2) {
            freshData[i * 4 + 3] = 0; // definite background
          }
        }

        // Update stored state with merged mask
        state.maskImageData = freshMask;

        const result = await compositeWithMask(state.originalBlob, freshMask);
        if (abortRef.current) return;

        await api.setFromBlob(result);
        pushHistory?.(result);
        setMode?.("preview");
      } catch (err) {
        if (!abortRef.current) {
          setError(
            err instanceof Error ? err.message : "ML re-run failed"
          );
          setTimeout(() => {
            setError(null);
            setMode?.("preview");
          }, 3000);
        }
      } finally {
        setProcessing(false);
      }
    };

    run();
  }, [mode, processing, canvasApi, model, handleProgress, pushHistory, setMode]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    setProcessing(false);
    setMode?.(null);
  }, [setMode]);

  // --- Mode: ml-refine-brush (persistent — renders brush canvas) ---
  if (mode === "ml-refine-brush" && hasMlMask()) {
    return <MlBrushCanvas />;
  }

  // Loading / error overlay for ml-remove-background and ml-refine-rerun
  if (!processing && !error) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 11,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        color: "#fff",
        fontSize: 14,
        gap: 12,
      }}
    >
      {error ? (
        <div style={{ color: "#f44336" }}>{error}</div>
      ) : (
        <>
          <div>
            {mode === "ml-refine-rerun"
              ? "Re-running ML..."
              : "Removing background..."}
          </div>
          <div
            style={{
              width: 200,
              height: 6,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#4caf50",
                borderRadius: 3,
                transition: "width 0.2s",
              }}
            />
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {progress < 100
              ? `Downloading model... ${progress}%`
              : "Processing..."}
          </div>
          <button
            onClick={handleCancel}
            style={{
              marginTop: 4,
              background: "#555",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
};
