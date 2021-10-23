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
import { moduleConfig } from "../util/configs";
import { romaineReducer, initialRomaineState, ClearHistory } from "../util";
import type { RomaineState, PushHistory, SetCropPoints } from "../util";
export type OpenCV = any;
declare global {
  interface Window {
    cv: OpenCV;
    Module: typeof moduleConfig;
  }
}
export interface RomaineContext {
  loaded: boolean;
  cv?: OpenCV;
  romaine: RomaineState & {
    clearHistory: ClearHistory;
  };
  setMode?: (mode: RomaineState["mode"]) => void;
  setAngle?: (angle: RomaineState["angle"]) => void;
  setCropPoints: SetCropPoints;
  pushHistory?: PushHistory;
  undo: PushHistory;
  redo: PushHistory;
}

const OpenCvContext = createContext<RomaineContext>({
  loaded: false,
  romaine: initialRomaineState as unknown as RomaineContext["romaine"],
  setCropPoints: null as unknown as SetCropPoints,
  undo: null as unknown as PushHistory,
  redo: null as unknown as PushHistory,
});
const { Consumer: OpenCvConsumer, Provider } = OpenCvContext;

const scriptId = "openCvScriptTag";
interface ROMAINE {
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

  const handleOnLoad = useCallback(() => {
    onLoad && onLoad(window.cv);
    setLoaded(true);
  }, [onLoad, setLoaded]);

  const generateOpenCvScriptTag = useMemo(() => {
    if (!document.getElementById(scriptId) && !window.cv) {
      const js = document.createElement("script");
      js.id = scriptId;
      js.src = openCvPath || "https://docs.opencv.org/3.4.13/opencv.js";
      js.nonce = "8IBTHwOdqNKAWeKl7plt8g==";
      js.defer = true;
      js.async = true;

      return js;
    } else if (document.getElementById(scriptId) && !window.cv) {
      return document.getElementById(scriptId);
    }
  }, [openCvPath]);

  useEffect(() => {
    if (document.getElementById(scriptId) || window.cv) {
      setLoaded(true);
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
  }, [openCvPath, handleOnLoad]);

  const [romaine, dispatchRomaine] = useReducer(
    romaineReducer,
    initialRomaineState
  );

  const setMode = useCallback(
    (mode: RomaineState["mode"]) => {
      dispatchRomaine({ type: "MODE", payload: mode });
    },
    [dispatchRomaine, romaineReducer]
  );
  const setAngle = useCallback(
    (angle: RomaineState["angle"]) => {
      dispatchRomaine({ type: "ANGLE", payload: angle });
    },
    [dispatchRomaine, romaineReducer]
  );
  const { cropPoints } = romaine;
  const setCropPoints: SetCropPoints = useCallback(
    (payload) => {
      if (typeof payload === "function") payload = payload(cropPoints);
      dispatchRomaine({ type: "CROP_POINTS", payload });
    },
    [dispatchRomaine, romaineReducer, cropPoints]
  );
  const pushHistory: PushHistory = useCallback(() => {
    dispatchRomaine({ type: "HISTORY", payload: { cmd: "PUSH" } });
  }, [dispatchRomaine, romaineReducer]);

  const clearHistory: ClearHistory = useCallback(() => {
    dispatchRomaine({ type: "HISTORY", payload: { cmd: "CLEAR" } });
  }, [dispatchRomaine, romaineReducer]);

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
    [dispatchRomaine, romaineReducer]
  );

  useEffect(() => {
    setAngle(angle);
  }, [angle]);

  const memoizedProviderValue: RomaineContext = useMemo(
    () => ({
      loaded,
      cv: window.cv,
      romaine: { ...romaine, clearHistory },
      setMode,
      setAngle,
      pushHistory,
      setCropPoints,
      undo: moveHistory(true),
      redo: moveHistory(false),
    }),
    [loaded, romaine, setMode, setAngle, pushHistory, moveHistory]
  );
  return <Provider value={memoizedProviderValue}>{children}</Provider>;
};
Romaine.propTypes = {
  openCvPath: PropTypes.string,
  children: PropTypes.node,
  onLoad: PropTypes.func,
};

export { OpenCvConsumer, OpenCvContext, Romaine };
