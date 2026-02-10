import { useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine, hasGrabCutMask } from "romaine";

export const RefineBackgroundIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { setMode } = useRomaine();
  // Re-evaluated on every render (mode changes trigger re-render via context)
  const maskAvailable = hasGrabCutMask();

  useEffect(() => {
    const eventListener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        e.preventDefault();
        if (hasGrabCutMask()) setMode?.("refine-background");
      }
    };
    window.addEventListener("keydown", eventListener);
    return () => {
      window.removeEventListener("keydown", eventListener);
    };
  }, [setMode]);
  return (
    <IconWrapper
      {...props}
      onClick={() => {
        if (maskAvailable) setMode?.("refine-background");
      }}
      selected="refine-background"
      tooltip={maskAvailable ? "Refine Background (Ctrl + Shift + R)" : "Run Remove Background first"}
      disabled={!maskAvailable}
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
        style={{ opacity: maskAvailable ? 1 : 0.3 }}
      >
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
        <path d="M14.5 17.5 4.5 15" />
      </svg>
    </IconWrapper>
  );
};
