"use client"

import {Editor as MonacoEditor} from "@monaco-editor/react";
import {forwardRef} from "react";
import {useTheme} from "next-themes";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";

export const Editor = forwardRef((props: any, ref) => {
  const {theme} = useTheme()

  return (
    <div className="flex flex-col gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <div>
            <Button type="button" size="sm" variant="outline">
              <Icons.zoom className="mr-2  h-5 w-5"/>
              Fullscreen
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="h-full w-full max-w-full max-h-full">
          <DialogHeader>
            <DialogTitle>Editor</DialogTitle>
            <DialogDescription/>
            <MonacoEditor
              {...props}
              height='100%'
              className="flex-1"
              theme={theme === 'dark' ? "vs-dark" : 'vs-light'}
            />
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <MonacoEditor
        {...props}
        className="flex-1"
        theme={theme === 'dark' ? "vs-dark" : 'vs-light'}
      />
    </div>
  );
});

Editor.displayName = 'Editor';