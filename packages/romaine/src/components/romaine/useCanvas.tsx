import { useCallback, useEffect, useRef, useState } from "react";
import { useRomaine } from "../../hooks";
import { ImagePtr } from "../../types";
import { isCrossOriginURL, readFile } from "../../util";

interface Props {
  image: string | File | null;
  saltId?: string;
}

export const useCanvas = ({ image, saltId }: Props) => {
  const {
    cv,
    romaine: { mode },
    updateImageInformation,
  } = useRomaine();
  const [loaded, setLoaded] = useState(false);

  const [originalImageDims, setOriginalImageDims] = useState({
    width: 0,
    height: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const canvasPtr = useRef<ImagePtr | undefined>();
  const getFile = useCallback(async (image) => await readFile(image), []);

  const createCanvas = useCallback(
    () =>
      new Promise<void>(async (resolve, reject) => {
        if (!image) return reject("Image source is invalid");
        const src = await getFile(image);
        try {
          const img = document.createElement("img");
          img.style.display = "none";
          img.id = `${saltId ? saltId + "-" : ""}working-image`;
          img.onload = async () => {
            // set edited image canvas and dimensions
            canvasRef.current = document.createElement("canvas");
            canvasRef.current.style.display = "none";
            canvasRef.current.id = `${
              saltId ? saltId + "-" : ""
            }working-canvas`;
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            setOriginalImageDims({ height: img.height, width: img.width });
            updateImageInformation?.({
              height: img.height,
              width: img.width,
              id: img.id,
            });
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#fff0"; // transparent
              ctx.fillRect(0, 0, img.width, img.height);
              ctx.drawImage(img, 0, 0);

              canvasPtr.current = cv.imread(canvasRef.current);
              setLoaded(true);
              return resolve();
            }
            return reject();
          };
          if (isCrossOriginURL(src)) img.crossOrigin = "anonymous";
          img.src = src;
        } catch (err) {
          console.error("Error in create canvas: ", err);
          reject("unknown error while creating canvas");
        }
      }),
    [image]
  );

  const resetImage = useCallback(() => {
    // set loaded to false before we destroy the pointer to avoid race conditions
    setLoaded(false);
    canvasPtr.current?.delete();
    createCanvas();
  }, [image]);

  useEffect(() => {
    if (image) resetImage();
  }, [image]);

  useEffect(() => {
    if (mode === "undo") {
      resetImage();
    }
  }, [mode]);

  return {
    canvasRef,
    createCanvas,
    originalImageDims,
    canvasPtr,
    resetImage,
    /** loaded: Is the image loaded onto the canvas and does the pointer exist */
    loaded,
  };
};
export type UseCanvasReturnType = ReturnType<typeof useCanvas>;
