import React, { useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";
interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

export const CropperIcon = (props: Props) => {
  const { setMode } = useRomaine();
  useEffect(() => {
    // using keydown because it already requires another key to be pressed
    const eventListenerCropper = (e: KeyboardEvent) => {
      if (!e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setMode && setMode("crop");
      }
    };
    window.removeEventListener("keydown", eventListenerCropper);
    window.addEventListener("keydown", eventListenerCropper);
    return () => {
      window.removeEventListener("keydown", eventListenerCropper);
    };
  }, []);
  return (
    <IconWrapper
      {...props}
      onClick={() => setMode && setMode("crop")}
      selected="crop"
      tooltip="Crop Tool (Shift + C)"
    >
      <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        height="25px"
        width="25px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
        <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
      </svg>
    </IconWrapper>
  );
};
