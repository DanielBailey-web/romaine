import React, {
  FC,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import PropTypes from "prop-types";
import { moduleConfig } from "../util/configs";
export type OpenCV = any;
declare global {
  interface Window {
    cv: OpenCV;
    Module: typeof moduleConfig;
  }
}

const OpenCvContext = createContext<OpenCV>(null);
const { Consumer: OpenCvConsumer, Provider } = OpenCvContext;
const scriptId = "opencv-react";

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

    const generateOpenCvScriptTag = () => {
      const js = document.createElement("script");
      js.id = scriptId;
      js.src = openCvPath || "https://docs.opencv.org/3.4.13/opencv.js";
      //@ts-ignore
      js.nonce = true;
      js.defer = true;
      js.async = true;

      return js;
    };

    document.body.appendChild(generateOpenCvScriptTag());
  }, [openCvPath, handleOnLoad]);

  const memoizedProviderValue = useMemo(
    () => ({ loaded, cv: window.cv }),
    [loaded]
  );
  return <Provider value={memoizedProviderValue}>{children}</Provider>;
};
Romaine.propTypes = {
  openCvPath: PropTypes.string,
  children: PropTypes.node,
  onLoad: PropTypes.func,
};

export { OpenCvConsumer, OpenCvContext, Romaine };
