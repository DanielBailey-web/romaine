import React from "react";

interface Props {}

export const FolderSelection = ({}: Props) => {
  return <input onChange={(e) => e.target.value} type="file" name="" id="" />;
};
