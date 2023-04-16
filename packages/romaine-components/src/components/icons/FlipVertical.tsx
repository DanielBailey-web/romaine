import React, { useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";

export const FlipVerticalIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { setMode } = useRomaine();
  useEffect(() => {
    // using keydown because it already requires another key to be pressed
    const eventListenerFlipVertical = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "|") {
        e.preventDefault();
        setMode?.("flip-vertical");
      }
    };
    window.removeEventListener("keydown", eventListenerFlipVertical);
    window.addEventListener("keydown", eventListenerFlipVertical);
    return () => {
      window.removeEventListener("keydown", eventListenerFlipVertical);
    };
  }, [setMode]);
  return (
    <IconWrapper
      {...props}
      onClick={() => setMode?.("flip-vertical")}
      selected="flip-vertical"
      tooltip="Flip Vertical (Ctrl + Shift + |)"
    >
      <svg
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        height={props.style?.height || "25px"}
        width={props.style?.width || "25px"}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 3l0 18"></path>
        <path d="M16 7l0 10l5 0l-5 -10"></path>
        <path d="M8 7l0 10l-5 0l5 -10"></path>
      </svg>
    </IconWrapper>
  );
};
