import { useEffect } from "react";
import { useRomaine } from "romaine";

export const MlRemoveBgIcon = (
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const {
    setMode,
    romaine: { mode },
  } = useRomaine();
  const isActive = mode === "ml-remove-background";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "M") {
        e.preventDefault();
        setMode?.("ml-remove-background");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setMode]);

  return (
    <button
      {...props}
      onClick={() => setMode?.("ml-remove-background")}
      title="ML Remove Background (Ctrl + Shift + M)"
      style={{
        background: isActive ? "#1976d2" : "transparent",
        border: "1px solid #666",
        borderRadius: 4,
        padding: 4,
        cursor: isActive ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isActive ? 0.7 : 1,
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
        {/* Sparkle/wand icon */}
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" />
        <path d="M22 5h-4" />
      </svg>
    </button>
  );
};
