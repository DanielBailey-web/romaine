import { useEffect } from "react";
import { useRomaine } from "romaine";
import { hasMlMask } from "../mlMaskState";

export const MlRefineIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const {
    setMode,
    romaine: { mode },
  } = useRomaine();
  const isActive = mode === "ml-refine-brush";
  const disabled = !hasMlMask();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "N") {
        e.preventDefault();
        if (hasMlMask()) setMode?.("ml-refine-brush");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setMode]);

  return (
    <button
      {...props}
      onClick={() => {
        if (!disabled) setMode?.("ml-refine-brush");
      }}
      title="ML Refine Background (Ctrl + Shift + N)"
      style={{
        background: isActive ? "#1976d2" : "transparent",
        border: "1px solid #666",
        borderRadius: 4,
        padding: 4,
        cursor: disabled ? "not-allowed" : isActive ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.35 : isActive ? 0.7 : 1,
        ...props.style,
      }}
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
        {/* Paintbrush icon */}
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
        <path d="M14.5 17.5 4.5 15" />
      </svg>
    </button>
  );
};
