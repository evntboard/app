"use client"

import React from "react";
import cookie from "js-cookie";
import {Shared, Trigger} from "@prisma/client";

import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";

import {SharedForm} from "./shared-form";
import {TriggerForm} from "./trigger-form";
import {TreeViewGlobal} from "./tree-view-global";

type Props = {
  tree: any,
  entity: unknown,
  organizationId: string,
  scriptType?: 'trigger' | 'shared',
  scriptId?: string,
  defaultLayout: number[]
}

export const Panel = (props: Props) => {
  const onLayout = (sizes: number[]) => {
    cookie.set("react-resizable-panels:layout", JSON.stringify(sizes), {
      domain: `.${window.location.hostname}`,
      secure: true,
      sameSite: "None",
    });
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="persistence"
      onLayout={onLayout}
    >
      <ResizablePanel
        minSize={5}
        defaultSize={props.defaultLayout[0] || 33}
        className="m-2 w-full h-full flex flex-col overflow-auto"
      >
        <TreeViewGlobal
          node={props.tree}
          organizationId={props.organizationId}
          scriptType={props.scriptType}
          scriptId={props.scriptId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle/>
      <ResizablePanel
        defaultSize={props.defaultLayout[1] || 67}
        minSize={25}
        className="m-2 w-full h-full flex flex-col"
      >
        {!props.scriptType && (
          <div>Nothing selected</div>
        )}
        {props.scriptType === 'shared' &&
          <SharedForm entity={props.entity as Shared} organizationId={props.organizationId}/>}
        {props.scriptType === 'trigger' &&
          <TriggerForm entity={props.entity as Trigger} organizationId={props.organizationId}/>}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}