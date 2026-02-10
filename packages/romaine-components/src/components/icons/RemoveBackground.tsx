import { useEffect } from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";

export const RemoveBackgroundIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { setMode } = useRomaine();
  useEffect(() => {
    const eventListener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "B") {
        e.preventDefault();
        setMode?.("remove-background");
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
      onClick={() => setMode?.("remove-background")}
      selected="remove-background"
      tooltip="Remove Background (Ctrl + Shift + B)"
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
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
        <path d="M12 3c-3 2.5 -4 6 -4 9s1 6.5 4 9" />
        <path d="M12 3c3 2.5 4 6 4 9s-1 6.5 -4 9" />
        <path d="M3 12h18" />
        <line x1="5" y1="5" x2="19" y2="19" strokeWidth="2.5" />
      </svg>
    </IconWrapper>
  );
};
