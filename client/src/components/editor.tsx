"use client"

import {Editor as MonacoEditor} from "@monaco-editor/react";
import {forwardRef} from "react";
import {useTheme} from "next-themes";

export const Editor = forwardRef((props: any, ref) => {
  const {theme} = useTheme()

  return (
    <MonacoEditor
      {...props}
      className="flex-1"
      theme={theme === 'dark' ? "vs-dark" : 'vs-light'}
    />
  );
});

Editor.displayName = 'Editor';