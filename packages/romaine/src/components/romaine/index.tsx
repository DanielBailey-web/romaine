import React, {
  FC,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useReducer,
} from "react";
import PropTypes from "prop-types";
import { moduleConfig } from "../../util/configs";
import { romaineReducer, initialRomaineState, ClearHistory } from "../../util";
import type { RomaineState, PushHistory, SetCropPoints } from "../../util";
import type { OpenCV } from "../../types/openCV";
declare global {
  interface Window {
    cv: OpenCV;
    Module: typeof moduleConfig;
  }
}
export interface RomaineContext {
  loaded: boolean;
  cv: OpenCV;
  romaine: RomaineState & {
    clearHistory: ClearHistory;
  };
  setImage: React.Dispatch<React.SetStateAction<string | File | null>>;
  setMode?: (mode: RomaineState["mode"]) => void;
  setAngle?: (angle: RomaineState["angle"]) => void;
  setScale?: (scale: RomaineState["scale"]) => void;
  setCropPoints: SetCropPoints;
  pushHistory?: PushHistory;
  undo: PushHistory;
  redo: PushHistory;
  updateImageInformation?: (imageInformation: RomaineState["image"]) => void;
}

const OpenCvContext = createContext<RomaineContext>({
  loaded: false,
  romaine: initialRomaineState as unknown as RomaineContext["romaine"],
  setCropPoints: null as unknown as SetCropPoints,
  undo: null as unknown as PushHistory,
  redo: null as unknown as PushHistory,
} as RomaineContext);
const { Consumer: OpenCvConsumer, Provider } = OpenCvContext;

const scriptId = "openCvScriptTag";
export interface ROMAINE {
  openCvPath?: string;
  onLoad?: (openCv: OpenCV) => void;
  children?: ReactNode;
  /** Angle to use when rotating images @default 90 */
  angle?: number;
}
/**
 * a romaine context for use in getting openCV and the canvas ref element
 * @todo
 * 1) Add ref to provider
 * 2) See if nonce is really required here
 */
const Romaine: FC<ROMAINE> = ({
  openCvPath,
  children,
  onLoad,
  angle = 90,
}: ROMAINE) => {
  const [loaded, setLoaded] = useState(false);
  const [_image, setImage] = useState<File | string | null>(null);

  const handleOnLoad = useCallback(() => {
    onLoad && onLoad(window.cv);
    setLoaded(true);
  }, [onLoad, setLoaded]);

  const generateOpenCvScriptTag = useMemo(() => {
    // make sure we are in the browser
    if (typeof window !== "undefined") {
      if (!document.getElementById(scriptId) && !window.cv) {
        const js = document.createElement("script");
        js.id = scriptId;
        js.nonce = "8IBTHwOdqNKAWeKl7plt8g==";
        js.defer = true;
        js.async = true;

        js.src = openCvPath || "https://docs.opencv.org/3.4.13/opencv.js";
        return js;
      } else if (document.getElementById(scriptId) && !window.cv) {
        return document.getElementById(scriptId);
      }
    }
  }, [openCvPath]);

  useEffect(() => {
    if (window.cv) {
      handleOnLoad();
      return;
    }

    // https://docs.opencv.org/3.4/dc/de6/tutorial_js_nodejs.html
    // https://medium.com/code-divoire/integrating-opencv-js-with-an-angular-application-20ae11c7e217
    // https://stackoverflow.com/questions/56671436/cv-mat-is-not-a-constructor-opencv
    moduleConfig.onRuntimeInitialized = handleOnLoad;
    window.Module = moduleConfig;

    // if (!document.getElementById(scriptId))
    if (generateOpenCvScriptTag && !document.getElementById(scriptId))
      document.body.appendChild(generateOpenCvScriptTag);
    // else handleOnLoad();
  }, [openCvPath, handleOnLoad, generateOpenCvScriptTag]);

  const [romaine, dispatchRomaine] = useReducer(
    romaineReducer,
    initialRomaineState
  );

  const setMode = useCallback(
    (mode: RomaineState["mode"]) => {
      dispatchRomaine({ type: "MODE", payload: mode });
    },
    [dispatchRomaine]
  );
  const setAngle = useCallback(
    (angle: RomaineState["angle"]) => {
      dispatchRomaine({ type: "ANGLE", payload: angle });
    },
    [dispatchRomaine]
  );
  const setScale = useCallback(
    (scale: RomaineState["scale"]) => {
      dispatchRomaine({ type: "SCALE", payload: scale });
    },
    [dispatchRomaine]
  );
  const updateImageInformation = useCallback(
    (image: RomaineState["image"]) => {
      dispatchRomaine({
        type: "SCALE",
        payload: {
          width: image.width,
          height: image.height,
        },
      });
      dispatchRomaine({ type: "IMAGE-UPDATE", payload: image });
    },
    [dispatchRomaine]
  );
  const {
    cropPoints,
    history: { pointer },
  } = romaine;

  const setCropPoints: SetCropPoints = useCallback(
    (payload) => {
      if (typeof payload === "function") payload = payload(cropPoints);
      dispatchRomaine({ type: "CROP_POINTS", payload });
    },
    [dispatchRomaine, cropPoints]
  );

  const pushHistory: PushHistory = useCallback(() => {
    dispatchRomaine({ type: "HISTORY", payload: { cmd: "PUSH" } });
  }, [dispatchRomaine]);

  const clearHistory: ClearHistory = useCallback(() => {
    dispatchRomaine({ type: "HISTORY", payload: { cmd: "CLEAR" } });
  }, [dispatchRomaine]);

  const moveHistory: (direction: boolean) => PushHistory = useCallback(
    (direction: boolean) => {
      if (direction)
        return () => {
          dispatchRomaine({ type: "MODE", payload: null });
          dispatchRomaine({ type: "HISTORY", payload: { cmd: "UNDO" } });
        };
      else
        return () => {
          dispatchRomaine({ type: "MODE", payload: null });
          dispatchRomaine({ type: "HISTORY", payload: { cmd: "REDO" } });
        };
    },
    [dispatchRomaine]
  );

  useEffect(() => {
    setAngle(angle);
  }, [angle, setAngle]);
  const memoizedProviderValue: RomaineContext = useMemo(
    () => ({
      loaded,
      cv:
        typeof window !== "undefined"
          ? window?.cv
          : (null as unknown as OpenCV),
      romaine: { ...romaine, history: { ...romaine.history }, clearHistory },
      setImage,
      setMode,
      setAngle,
      setScale,
      updateImageInformation,
      pushHistory,
      setCropPoints,
      undo: moveHistory(true),
      redo: moveHistory(false),
    }),
    [
      loaded,
      romaine,
      pointer,
      setMode,
      setAngle,
      setScale,
      pushHistory,
      moveHistory,
      clearHistory,
      setCropPoints,
      updateImageInformation,
    ]
  );
  // const { canvasRef } = useCanvas({ image });
  // usePreview({ cv: memoizedProviderValue, canvasRef });
  return <Provider value={memoizedProviderValue}>{children}</Provider>;
};
Romaine.propTypes = {
  openCvPath: PropTypes.string,
  children: PropTypes.node,
  onLoad: PropTypes.func,
  angle: PropTypes.number,
};

export { OpenCvConsumer, OpenCvContext, Romaine };
