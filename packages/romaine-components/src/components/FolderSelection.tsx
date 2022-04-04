import React, { useEffect, useReducer, useState } from "react";

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  handleDrop?: (
    File: FileList | null,
    ev: React.DragEvent<HTMLDivElement>
  ) => void;
  getFiles?: (File: FileList | string | null) => void;
  children?: React.ReactNode;
  image: File | string | null;
  menu?: boolean;
  outline?: boolean;
}

export const FolderSelection = ({
  handleDrop,
  getFiles,
  children,
  image,
  outline = true,
  menu = false,
  ...props
}: Props) => {
  const initialInputStyles: React.CSSProperties = {
    display: "none",
  };
  const initialLabelStyles: React.CSSProperties = {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "100%",
    outline: outline ? "thin solid black" : undefined,
  };
  const initialDivStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 2000,
    backgroundColor: "white",
  };
  const hoverInputStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "block",
    visibility: "hidden",
  };
  const hoverLabelStyles: React.CSSProperties = {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "100%",
    outline: outline ? "thin solid black" : undefined,
    backgroundColor: "lightblue",
  };
  const hoverDivStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "white",
    zIndex: 2000,
  };
  const finalInputStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "block",
    visibility: "hidden",
  };
  const finalLabelStyles: React.CSSProperties = {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "100%",
    outline: outline ? "thin solid black" : undefined,
    cursor: "pointer",
  };
  const finalDivStyles: React.CSSProperties = {
    display: menu ? "hidden" : "flex",
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 300,
    width: "240px",
  };

  const initialState = {
    inputStyles: initialInputStyles,
    labelStyles: initialLabelStyles,
    divStyles: initialDivStyles,
  };

  type Reducer<S, A> = (prevState: S, action: A) => S;
  const reducer: Reducer<typeof initialState, "initial" | "hover" | "final"> = (
    state,
    action
  ) => {
    if (action === "initial")
      return {
        inputStyles: initialInputStyles,
        labelStyles: initialLabelStyles,
        divStyles: initialDivStyles,
      };
    if (action === "hover")
      return {
        inputStyles: hoverInputStyles,
        labelStyles: hoverLabelStyles,
        divStyles: hoverDivStyles,
      };
    if (action === "final")
      return {
        inputStyles: finalInputStyles,
        labelStyles: finalLabelStyles,
        divStyles: finalDivStyles,
      };

    return { ...state };
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (image) dispatch("final");
    const preventDefault = (event: DragEvent) => {
      event.preventDefault();
    };
    const preventDefaultDrop = (event: DragEvent) => {
      dispatch("final");
      event.preventDefault();
    };
    const dragEnter = () => {
      dispatch("hover");
    };
    const dragExit = () => {
      dispatch(image ? "final" : "initial");
    };

    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefaultDrop);
    window.addEventListener("dragenter", dragEnter);
    window.addEventListener("dragexit", dragExit);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
      window.removeEventListener("dragenter", dragEnter);
      window.removeEventListener("dragexit", dragExit);
    };
    // @eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);
  //https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
  function dropHandler(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    const files = ev.dataTransfer ? ev.dataTransfer.files : null;
    handleDrop && handleDrop(files, ev);
    getFiles && getFiles(files);
    dispatch("initial");
  }
  const [inputValue, setInputValue] =
    useState<React.InputHTMLAttributes<HTMLInputElement>["value"]>();

  return (
    <div onDrop={dropHandler} style={state.divStyles}>
      <label
        id="drop_zone"
        htmlFor="romaine-folder-input"
        style={state.labelStyles}
      >
        <input
          type="file"
          value={inputValue}
          {...props}
          style={{ ...state.inputStyles, ...props.style }}
          id="romaine-folder-input"
          onChange={(e) => {
            props.onChange && props.onChange(e);
            setInputValue(e.target.value);
            getFiles && getFiles(e.target.files);
            dispatch("final");
          }}
        />
        {children}
      </label>
    </div>
  );
};
