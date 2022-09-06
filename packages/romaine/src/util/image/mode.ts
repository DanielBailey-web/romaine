import { RomaineContext } from "../../components";
import { UseCanvasReturnType } from "../../components/romaine/useCanvas";
import { UsePreviewReturnType } from "../../components/romaine/usePreview";
import { rotate } from "./rotate";

interface ModeProps {
  romaine: RomaineContext;
  _preview: UsePreviewReturnType;
  _canvas: UseCanvasReturnType;
}
export const handleModeChange = ({
  romaine: {
    cv,
    setMode,
    romaine: { mode, clearHistory, angle, cropPoints },
    pushHistory,
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
      console.log("undo not working");
      resetImage();
      createPreview();
      break;
    }
    case "crop": {
      pushHistory?.();
      console.log({ cropPoints });
      break;
    }
    case "perspective-crop": {
      pushHistory?.();
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
      createPreview(
        setPreviewPaneDimensions({
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        }),
        undefined,
        false
      );
      setMode?.(null);
      break;
    }
  }
};
