import { RomaineExample } from "../components/Example";
import { Romaine } from "romaine";
import { useState, useMemo, useEffect } from "react";

export default function Web() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const image = useMemo(
    () => `https://source.unsplash.com/random?unique=${Math.random()}`,
    []
  );
  useEffect(() => {
    if (blob !== null) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "image.png"); //or any other extension
      document.body.appendChild(link);
      link.click();
    }
  }, [blob]);
  return (
    <div>
      <Romaine openCvPath="/cv.js">
        <RomaineExample
          image={null}
          imageExportOptions={{ type: "image/jpeg" }}
          setBlob={setBlob}
        />
      </Romaine>
    </div>
  );
}
