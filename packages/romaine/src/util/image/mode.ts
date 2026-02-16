import { RomaineContext } from "../../components";
import { UseCanvasReturnType } from "../../components/romaine/useCanvas";
import { UsePreviewReturnType } from "../../components/romaine/usePreview";
import { cropOpenCV } from "./cropOpenCV";
import { flip } from "./flip";
import { removeBackground, refineBackground, clearGrabCutState } from "./removeBackground";
import { rotate } from "./rotate";
import { scale } from "./scale";
import { warpPerspective } from "./warpPerspective";

interface ModeProps {
  romaine: RomaineContext;
  _preview: UsePreviewReturnType;
  _canvas: UseCanvasReturnType;
}
export const handleModeChange = async ({
  romaine: {
    cv,
    setMode,
    romaine: { mode, clearHistory, angle, history, scale: newScale },
    pushHistory,
    undo,
  },
  _canvas: { canvasRef, canvasPtr, resetImage },
  _preview: { previewRef, createPreview, setPreviewPaneDimensions },
}: ModeProps) => {
  switch (mode) {
    case "full-reset": {
      clearGrabCutState();
      clearHistory();
      resetImage();
      createPreview();
      setMode?.(null);
      break;
    }
    case "undo": {
      let waitingOnPointer = true;
      if (history.pointer === 1) {
        undo();
        setMode?.("preview");
        return;
      }
      // if history.pointer -1 is 0, we're at the beginning of the history
      if (history.pointer - 1 === 0) {
        resetImage();
        setMode?.(null);
        return;
      }
      for (let i = 0; i < history.pointer - 1; i++) {
        if (!canvasPtr.current?.$$.ptr) {
          continue;
        }
        waitingOnPointer = false;
        switch (history.commands[i].cmd) {
          case "rotate-left":
            rotate(
              cv,
              canvasRef.current,
              mode,
              setPreviewPaneDimensions,
              createPreview,
              {
                angle: history.commands[i].payload,
                preview: false,
                cleanup: false,
              },
              canvasPtr.current
            );
            break;
          case "rotate-right": {
            rotate(
              cv,
              canvasRef.current,
              mode,
              setPreviewPaneDimensions,
              createPreview,
              {
                angle: history.commands[i].payload,
                preview: false,
                cleanup: false,
              },
              canvasPtr.current
            );
            break;
          }
          case "crop": {
            cropOpenCV(
              cv,
              canvasPtr.current,
              history.commands[i].payload,
              setPreviewPaneDimensions({
                width: canvasPtr.current.cols,
                height: canvasPtr.current.rows,
              }) as number
            );
            break;
          }
          case "perspective-crop":
            warpPerspective(
              cv,
              canvasPtr.current,
              history.commands[i].payload,
              setPreviewPaneDimensions({
                width: canvasPtr.current.cols,
                height: canvasPtr.current.rows,
              }) as number
            );
            break;
          case "flip-horizontal":
            flip(cv, canvasRef.current, canvasPtr.current, "horizontal");
            break;
          case "flip-vertical":
            flip(cv, canvasRef.current, canvasPtr.current, "vertical");
            break;
          case "scale":
            scale(cv, canvasRef.current, canvasPtr.current, newScale);
            break;
          case "remove-background":
            removeBackground(cv, canvasRef.current, canvasPtr.current);
            break;
          case "refine-background":
            if (history.commands[i].payload) {
              refineBackground(cv, canvasRef.current, canvasPtr.current, history.commands[i].payload);
            }
            break;
          default: {
            // Plugin modes: if payload is a Blob, apply it to canvasPtr
            const cmdPayload = history.commands[i].payload;
            if (cmdPayload instanceof Blob) {
              const url = URL.createObjectURL(cmdPayload);
              const img = new Image();
              img.src = url;
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  const tmp = document.createElement("canvas");
                  tmp.width = img.width;
                  tmp.height = img.height;
                  const ctx = tmp.getContext("2d")!;
                  ctx.drawImage(img, 0, 0);
                  const newMat = cv.imread(tmp);
                  if (canvasPtr.current) canvasPtr.current.delete();
                  canvasPtr.current = newMat;
                  URL.revokeObjectURL(url);
                  resolve();
                };
              });
            }
            break;
          }
        }
      }
      if (!waitingOnPointer) {
        undo();
        setMode?.("preview");
      }
      return;
    }
    case "crop": {
      // cropping modes are handled in CroppingCanvas.tsx
      break;
    }
    case "perspective-crop": {
      // cropping modes are handled in CroppingCanvas.tsx
      break;
    }
    case "flip-horizontal": {
      if (canvasPtr.current) {
        flip(cv, canvasRef.current, canvasPtr.current, "horizontal");
        pushHistory?.();
      }
      setMode?.("preview");
      break;
    }
    case "flip-vertical": {
      if (canvasPtr.current) {
        flip(cv, canvasRef.current, canvasPtr.current, "vertical");
        pushHistory?.();
      }
      setMode?.("preview");
      break;
    }
    case "scale": {
      pushHistory?.();
      if (canvasPtr.current)
        scale(cv, canvasRef.current, canvasPtr.current, newScale);
      setMode?.("preview");
      break;
    }
    case "remove-background": {
      if (canvasPtr.current) {
        pushHistory?.();
        removeBackground(cv, canvasRef.current, canvasPtr.current);
      }
      setMode?.("preview");
      break;
    }
    case "refine-background": {
      // Persistent mode — handled by BrushCanvas component
      break;
    }
    case "rotate-left": {
      pushHistory?.();
      rotate(
        cv,
        previewRef.current,
        mode,
        setPreviewPaneDimensions,
        createPreview,
        {
          angle,
          preview: true,
        }
      );

      setTimeout(() => {
        rotate(
          cv,
          canvasRef.current,
          mode,
          setPreviewPaneDimensions,
          createPreview,
          {
            angle,
            preview: false,
            cleanup: false,
          },
          canvasPtr.current
        ).then(() => setMode?.(null));
      }, 0);
      break;
    }
    case "rotate-right": {
      pushHistory?.();
      if (previewRef.current)
        rotate(
          cv,
          previewRef.current,
          mode,
          setPreviewPaneDimensions,
          createPreview,
          {
            angle: 360 - angle,
            preview: true,
          }
        );
      setTimeout(() => {
        rotate(
          cv,
          canvasRef.current,
          mode,
          setPreviewPaneDimensions,
          createPreview,
          {
            angle: 360 - angle,
            preview: false,
            cleanup: false,
          },
          canvasPtr.current
        ).then(() => setMode?.(null));
      }, 0);
      break;
    }
    case "preview": {
      if (!canvasPtr.current?.$$.ptr) {
        break;
      }
      createPreview(
        setPreviewPaneDimensions({
          width: canvasPtr.current?.cols,
          height: canvasPtr.current?.rows,
        }),
        canvasPtr.current,
        false
      );
      setMode?.(null);
      break;
    }
    default:
      // Unknown/plugin modes — no-op (plugin handles via its own component)
      break;
  }
};
