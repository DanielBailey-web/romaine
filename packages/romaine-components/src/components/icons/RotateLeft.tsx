import React from "react";
import { IconWrapper } from "./IconWrapper";
import { useRomaine } from "romaine";

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}
/**
 * @todo
 * 1) Need the ability to change angle for rotation
 *    1) Need to add angle of rotation to the Romaine context and create a reducer helper to change value
 *
 *
 *    This needs to be done in romaine not romaine-components (here)
 *    2) Need to dynamically add an input that can change the angle of rotation
 * @copyright The SVG comes from: Ant Design Icons https://github.com/ant-design/ant-design-icons
 * @license MIT
 */
export const RotateLeft = (props: Props) => {
  const { setMode } = useRomaine();
  return (
    <IconWrapper
      {...props}
      onClick={() => setMode && setMode("rotate-left")}
      selected="rotate-left"
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 1024 1024"
        version="1.1"
        height="25px"
        width="25px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs></defs>
        <path d="M672 418H144c-17.7 0-32 14.3-32 32v414c0 17.7 14.3 32 32 32h528c17.7 0 32-14.3 32-32V450c0-17.7-14.3-32-32-32z m-44 402H188V494h440v326z"></path>
        <path d="M819.3 328.5c-78.8-100.7-196-153.6-314.6-154.2l-0.2-64c0-6.5-7.6-10.1-12.6-6.1l-128 101c-4 3.1-3.9 9.1 0 12.3L492 318.6c5.1 4 12.7 0.4 12.6-6.1v-63.9c12.9 0.1 25.9 0.9 38.8 2.5 42.1 5.2 82.1 18.2 119 38.7 38.1 21.2 71.2 49.7 98.4 84.3 27.1 34.7 46.7 73.7 58.1 115.8 11 40.7 14 82.7 8.9 124.8-0.7 5.4-1.4 10.8-2.4 16.1h74.9c14.8-103.6-11.3-213-81-302.3z"></path>
      </svg>
    </IconWrapper>
  );
};
