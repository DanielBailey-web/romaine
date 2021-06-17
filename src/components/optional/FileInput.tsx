import React, { useEffect, useReducer, useState } from "react";

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  handleDrop?: (
    File: FileList | null,
    ev: React.DragEvent<HTMLLabelElement>
  ) => void;
  getFiles?: (File: FileList | string | null) => void;
  children?: React.ReactNode;
}

export const FolderSelection = ({
  handleDrop,
  getFiles,
  children,
  ...props
}: Props) => {
  const initialInputStyles: React.CSSProperties = {};
  const initialLabelStyles: React.CSSProperties = {};
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
    padding: "15em 0",
    outline: "thin solid black",
  };

  const initialState = {
    inputStyles: initialInputStyles,
    labelStyles: initialLabelStyles,
  };

  type Reducer<S, A> = (prevState: S, action: A) => S;
  const reducer: Reducer<typeof initialState, "initial" | "hover"> = (
    state,
    action
  ) => {
    if (action === "initial")
      return {
        inputStyles: initialInputStyles,
        labelStyles: initialLabelStyles,
      };
    if (action === "hover")
      return { inputStyles: hoverInputStyles, labelStyles: hoverLabelStyles };

    return { ...state };
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch("hover");
    const preventDefault = (event: DragEvent) => {
      event.preventDefault();
    };
    const dragEnter = () => {
      dispatch("hover");
    };
    const dragExit = () => {
      dispatch("initial");
    };

    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    window.addEventListener("dragenter", dragEnter);
    window.addEventListener("dragexit", dragExit);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
      window.removeEventListener("dragenter", dragEnter);
      window.removeEventListener("dragexit", dragExit);
    };
  }, []);
  //https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
  function dropHandler(ev: React.DragEvent<HTMLLabelElement>) {
    ev.preventDefault();
    const files = ev.dataTransfer ? ev.dataTransfer.files : null;
    handleDrop && handleDrop(files, ev);
    getFiles && getFiles(files);
    dispatch("initial");
  }
  const [inputValue, setInputValue] =
    useState<React.InputHTMLAttributes<HTMLInputElement>["value"]>();

  return (
    <label
      id="drop_zone"
      htmlFor="romaine-folder-input"
      style={state.labelStyles}
      onDrop={dropHandler}
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
        }}
      />
      {children}
    </label>
  );
};
