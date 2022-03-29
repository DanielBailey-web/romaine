import React, { useCallback, useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}
/**
 * @copyright The SVG comes from: Remix Icons https://remixicon.com/
 * @license `Apache 2.0`
 */
export const FullReset = (props: Props) => {
  const {
    setMode,
    romaine: {
      history: {
        pointer,
        commands: { length },
      },
    },
  } = useRomaine();
  // using keydown because it already requires another key to be pressed
  const eventListenerCropper = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        pointer &&
          window.confirm(
            "Are you sure you want to reset this image? All current cropping progress will be lost."
          ) &&
          setMode &&
          setMode("full-reset");
      }
    },
    [pointer]
  );
  useEffect(() => {
    window.removeEventListener("keydown", eventListenerCropper);
    window.addEventListener("keydown", eventListenerCropper);
    return () => {
      window.removeEventListener("keydown", eventListenerCropper);
    };
  }, [eventListenerCropper]);
  return (
    <IconWrapper
      {...props}
      onClick={() =>
        window.confirm(
          "Are you sure you want to reset this image? All current cropping progress will be lost."
        ) &&
        setMode &&
        setMode("full-reset")
      }
      selected="full-reset"
      tooltip={"Reinitialize Image (Ctrl + Shift + Z)"}
      disabled={!length}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 24 24"
        height="25px"
        width="25px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path fill="none" d="M0 0h24v24H0z"></path>
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm4.82-4.924A7 7 0 0 0 9.032 5.658l.975 1.755A5 5 0 0 1 17 12h-3l2.82 5.076zm-1.852 1.266l-.975-1.755A5 5 0 0 1 7 12h3L7.18 6.924a7 7 0 0 0 7.788 11.418z"></path>
        </g>
      </svg>
    </IconWrapper>
  );
};
