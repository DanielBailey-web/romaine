import "react-draggable";
import { ReactNode } from "react";

declare module "react-draggable" {
  interface DraggableCoreProps {
    children?: ReactNode;
  }
}
