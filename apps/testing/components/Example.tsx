import { useCallback, useRef, useState } from "react";
import { Canvas, RomaineRef, useRomaine, isCrossOriginURL } from "romaine";
import type { ImageExportOptions } from "romaine";
import {
  CropperIcon,
  FlipHorizontalIcon,
  FolderSelection,
  FullReset,
  PerspectiveIcon,
  RotateLeft,
  RotateRight,
  UndoIcon,
  FlipVerticalIcon,
} from "romaine-components";
import { useMeasure } from "react-use";
import { useEffect } from "react";
interface RomaineExampleProps {
  setBlob?: (blob: Blob | null) => void;
  image?: string | null;
  imageExportOptions?: Partial<ImageExportOptions>;
}
/**
 * @todo 1) move the get blob button into its own file
 */
export const RomaineExample = ({
  setBlob,
  image = null,
  imageExportOptions,
}: RomaineExampleProps) => {
  const RomaineRef = useRef<RomaineRef>(null);
  const { loaded, setMode, setScale, romaine } = useRomaine();
  const [state, setstate] = useState<File | string | null>(image);
  const [containerRef, { x, y, width, height, top, right, bottom, left }] =
    useMeasure<HTMLDivElement>();

  // useEffect(() => {
  //   if (!image) {
  //     setstate("https://source.unsplash.com/random");
  //   }
  // }, []);

  useEffect(() => {
    function pasteEventListenter(e: ClipboardEvent) {
      const { clipboardData } = e as any;
      if (clipboardData) {
        const items = clipboardData.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            // file
            if (items[i].kind === "file") {
              const file = items[i].getAsFile();
              if (file) {
                setstate(file);
                // only do first file until layers is working
                return;
              }
            }
          }
          for (let i = 0; i < items.length; i++) {
            // url
            if (items[i].kind === "string") {
              let shouldReturn = false;
              items[i].getAsString((url: string) => {
                if (url) {
                  setstate(url);
                  shouldReturn = true;
                }
              });
              if (shouldReturn) return;
            }
          }
        }
      }
    }
    window.addEventListener("paste", pasteEventListenter as any);
    return () => {
      window.removeEventListener("paste", pasteEventListenter as any);
    };
  }, []);

  // This function along with the api route removed cors errors
  // when the image is loaded from a url that is not the same origin
  // and has a cors setting that is not *
  const handleCrossOriginUrlCheck = useCallback(
    (image: File | string | null) => {
      if (typeof window !== "undefined") {
        if (typeof image === "string") {
          const isCrossOrigin = isCrossOriginURL(image as string);
          if (isCrossOrigin) {
            return "/api/un-cors-image?url=" + image;
          }
          return image;
        }
        return image;
      }
      return null;
    },
    []
  );

  return (
    <div className="fixed inset-0">
      <div className="relative w-full h-full p-16">
        <button
          className="absolute top-0"
          onClick={() => {
            RomaineRef.current?.crop?.();
          }}
        >
          crop
        </button>
        <button
          className="absolute top-0 left-96"
          onClick={() => {
            setScale?.({
              height: 300,
              width: 300,
            });
            setMode?.("scale");
          }}
        >
          scale to 300x300px
        </button>
        <div
          className="w-full h-full relative border border-black pr-64"
          ref={containerRef}
        >
          {loaded && (
            <>
              <Canvas
                ref={RomaineRef}
                image={handleCrossOriginUrlCheck(state)}
                maxHeight={height}
                maxWidth={width}
                pointSize={5}
                lineWidth={1}
              />

              <FolderSelection
                image={state}
                getFiles={(files: string | FileList | null) =>
                  files &&
                  setstate(typeof files === "string" ? files : files[0])
                }
              >
                <span style={{ display: "grid", placeItems: "center" }}>
                  {state ? (
                    "Choose a Different File"
                  ) : (
                    <p className="capitalize">
                      <span>Choose an image to get started:</span>
                      <br />
                      <span>1) Click here to browse for a File</span>
                      <br />
                      <span>2) Drag a File over</span>
                      <br />
                      <span>
                        3) Paste an image or an image url from your clipboard
                      </span>
                    </p>
                  )}
                </span>
              </FolderSelection>
              <button
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "3ch",
                  zIndex: 400,
                  outline: "thin solid black",
                  borderRadius: 0,
                  fontSize: "16px",
                  background: "white",
                  width: "240px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={async () => {
                  setMode && setMode(null);
                  // need to let mode actually get set to null
                  // React 18 useTransition would be nice here...
                  // but for backwards compatability currently doing this...
                  setTimeout(async () => {
                    // data url
                    // console.log(
                    //   await RomaineRef.current?.getDataURL?.({
                    //     ...imageExportOptions,
                    //   })
                    // );
                    if (setBlob && RomaineRef.current?.getBlob) {
                      const newBlob =
                        (await RomaineRef.current?.getBlob({
                          ...imageExportOptions,
                          jpeg: {
                            transparentToWhite: true,
                          },
                        })) || null;
                      // console.log(newBlob);
                      setBlob(newBlob);
                    } else {
                      console.warn(
                        "You must give the example setBlob as an input"
                      );
                    }
                  }, 0);
                }}
              >
                Export Image
              </button>
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  bottom: "0",
                  right: "0",
                  width: "240px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gridTemplateRows: "repeat(6, 40px)",
                  }}
                >
                  <RotateLeft />
                  <RotateRight />
                  <CropperIcon />
                  <PerspectiveIcon />
                  <FullReset />
                  <div></div>
                  <UndoIcon />
                  <FlipHorizontalIcon />
                  <FlipVerticalIcon />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
