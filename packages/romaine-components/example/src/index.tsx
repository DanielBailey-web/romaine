import React, { useRef, useState } from "react";
import { Canvas, RomaineRef, useRomaine } from "romaine";
import type { ImageExportOptions } from "romaine";
import {
  CropperIcon,
  FolderSelection,
  FullReset,
  PerspectiveIcon,
  RotateLeft,
  RotateRight,
  UndoIcon,
} from "../../";
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
  image = "https://source.unsplash.com/random",
  imageExportOptions,
}: RomaineExampleProps) => {
  const RomaineRef = useRef<RomaineRef>(null);
  const { loaded, setMode } = useRomaine();
  const [state, setstate] = useState<File | string | null>(image);

  return (
    <div style={{ marginTop: "4em" }}>
      {loaded && (
        <Canvas
          saltId={Math.random().toString()}
          ref={RomaineRef}
          image={state}
          maxHeight={500}
          maxWidth={500}
          onChange={() => {}}
          onDragStop={() => {}}
          pointSize={5}
          lineWidth={1}
          wrapperProps={{ style: { border: "thin solid black" } }}
        >
          <FolderSelection
            image={state}
            getFiles={(files: string | FileList | null) => {
              if (!files) return;
              setstate(typeof files === "string" ? files : files[0]);
            }}
          >
            <span style={{ display: "grid", placeItems: "center" }}>
              {state ? "Choose a Different File" : "Choose or Drag a File Here"}
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
                console.log(
                  await RomaineRef.current?.getDataURL?.({
                    ...imageExportOptions,
                  })
                );
                if (setBlob && RomaineRef.current?.getBlob) {
                  const newBlob =
                    (await RomaineRef.current?.getBlob({
                      ...imageExportOptions,
                    })) || null;
                  setBlob(newBlob);
                } else {
                  console.warn("You must give the example setBlob as an input");
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
              style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)" }}
            >
              <RotateLeft />
              <RotateRight />
              <CropperIcon />
              <PerspectiveIcon />
              <FullReset />
              <div></div>
              <UndoIcon />
            </div>
          </div>
        </Canvas>
      )}
    </div>
  );
};
