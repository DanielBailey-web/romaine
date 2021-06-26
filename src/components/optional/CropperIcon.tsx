import React from "react";

export const CropperIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      stroke-width="2"
      viewBox="0 0 24 24"
      stroke-linecap="round"
      stroke-linejoin="round"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
    </svg>
  );
};
