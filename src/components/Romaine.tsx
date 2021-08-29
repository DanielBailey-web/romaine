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
import { cropperReducer, initialRomaineState, RomaineState } from "../util";
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
  romaine: RomaineState;
  setMode?: (mode: RomaineState["mode"]) => void;
}

const OpenCvContext = createContext<RomaineContext>({
  loaded: false,
  romaine: initialRomaineState,
});
const { Consumer: OpenCvConsumer, Provider } = OpenCvContext;

const scriptId = "openCvScriptTag";
interface ROMAINE {
  openCvPath?: string;
  onLoad?: (openCv: OpenCV) => void;
  children?: ReactNode;
}
/**
 * a romaine context for use in getting openCV and the canvas ref element
 * @todo
 * 1) remove ts-ignore
 * 2) Add ref to provider
 */
const Romaine: FC<ROMAINE> = ({ openCvPath, children, onLoad }) => {
  const [loaded, setLoaded] = useState(false);

  const handleOnLoad = useCallback(() => {
    if (onLoad) {
      onLoad(window.cv);
    }
    setLoaded(true);
  }, [onLoad]);

  const generateOpenCvScriptTag = useMemo(() => {
    if (!document.getElementById(scriptId) && !window.cv) {
      const js = document.createElement("script");
      js.id = scriptId;
      js.src = openCvPath || "https://docs.opencv.org/3.4.13/opencv.js";
      //@ts-ignore
      js.nonce = true;
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
    cropperReducer,
    initialRomaineState
  );

  const setMode = useCallback(
    (mode: RomaineState["mode"]) => {
      dispatchRomaine({ type: "MODE", payload: mode });
    },
    [dispatchRomaine, cropperReducer]
  );

  const memoizedProviderValue = useMemo(
    () => ({ loaded, cv: window.cv, romaine, setMode }),
    [loaded, romaine]
  );
  return <Provider value={memoizedProviderValue}>{children}</Provider>;
};
Romaine.propTypes = {
  openCvPath: PropTypes.string,
  children: PropTypes.node,
  onLoad: PropTypes.func,
};

export { OpenCvConsumer, OpenCvContext, Romaine };
