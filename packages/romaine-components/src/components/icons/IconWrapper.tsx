import React, { useState } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { RomaineModes, useRomaine } from "romaine";

export type IconProps = DetailedHTMLProps<
  HTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  selected?: boolean | RomaineModes;
  tooltip?: string;
  disabled?: boolean;
};

export const IconWrapper = ({
  selected,
  children,
  tooltip,
  disabled = false,
  ...props
}: IconProps) => {
  const {
    romaine: { mode },
  } = useRomaine();
  const [hover, sethover] = useState<boolean>(false);
  return (
    <abbr
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        display: "block",
        width: "100%",
        height: "100%",
      }}
      title={tooltip}
      aria-label={tooltip}
    >
      <button
        onMouseEnter={() => sethover(true)}
        onMouseLeave={() => sethover(false)}
        {...props}
        style={{
          border:
            selected === true || selected === mode || hover
              ? "thin solid black"
              : "thin solid transparent",
          borderRadius: "4px",
          backgroundColor: hover
            ? "#888"
            : selected === true || selected === mode
            ? "#555"
            : "#fff0",
          display: "grid",
          placeItems: "center",
          height: "100%",
          width: "100%",
          pointerEvents: disabled ? "none" : "all",
          ...props.style,
        }}
      >
        {children}
      </button>
    </abbr>
  );
};
