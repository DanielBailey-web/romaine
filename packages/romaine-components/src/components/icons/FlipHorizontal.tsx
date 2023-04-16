import React, { useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";

export const FlipHorizontalIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { setMode } = useRomaine();
  useEffect(() => {
    // using keydown because it already requires another key to be pressed
    const eventListenerFlipHorizontal = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "_") {
        e.preventDefault();
        setMode?.("flip-horizontal");
      }
    };
    window.removeEventListener("keydown", eventListenerFlipHorizontal);
    window.addEventListener("keydown", eventListenerFlipHorizontal);
    return () => {
      window.removeEventListener("keydown", eventListenerFlipHorizontal);
    };
  }, [setMode]);
  return (
    <IconWrapper
      {...props}
      onClick={() => setMode?.("flip-horizontal")}
      selected="flip-horizontal"
      tooltip="Flip Horizontal (Ctrl + Shift + _)"
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
        <path d="M3 12l18 0"></path>
        <path d="M7 16l10 0l-10 5l0 -5"></path>
        <path d="M7 8l10 0l-10 -5l0 5"></path>
      </svg>
    </IconWrapper>
  );
};
