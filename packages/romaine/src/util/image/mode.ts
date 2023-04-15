import { RomaineContext } from "../../components";
import { UseCanvasReturnType } from "../../components/romaine/useCanvas";
import { UsePreviewReturnType } from "../../components/romaine/usePreview";
import { cropOpenCV } from "./cropOpenCV";
import { flip } from "./flip";
import { rotate } from "./rotate";
import { warpPerspective } from "./warpPerspective";

interface ModeProps {
  romaine: RomaineContext;
  _preview: UsePreviewReturnType;
  _canvas: UseCanvasReturnType;
}
export const handleModeChange = ({
  romaine: {
    cv,
    setMode,
    romaine: { mode, clearHistory, angle, history },
    pushHistory,
    undo,
  },
  _canvas: { canvasRef, canvasPtr, resetImage },
  _preview: { previewRef, createPreview, setPreviewPaneDimensions },
}: ModeProps) => {
  switch (mode) {
    case "full-reset": {
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
      if (canvasPtr.current)
        flip(cv, canvasRef.current, canvasPtr.current, "horizontal");
      setMode?.("preview");
      break;
    }
    case "flip-vertical": {
      if (canvasPtr.current)
        flip(cv, canvasRef.current, canvasPtr.current, "vertical");
      setMode?.("preview");
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
        console.error("canvas ptr was undefined");
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
  }
};
