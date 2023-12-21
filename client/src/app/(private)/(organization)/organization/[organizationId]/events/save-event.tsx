"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
import {useParams} from "next/navigation";
import {Event as EvntBoardEvent} from "@prisma/client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {toast} from "@/components/ui/use-toast";

type Props = {
  event: EvntBoardEvent,
}

export const SaveEvent = ({event}: Props) => {
  const {organizationId} = useParams()
  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOpenDialog = (e: any) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  const handleOnSave = async () => {
    try {
      setIsSaving(true)
      await ky.post(`/api/organization/${organizationId}/event`, {
        json: {
          name: event.name,
          payload: event.payload
        }
      })

      toast({
        description: "Event saved",
      })
      setOpenDialog(false)
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your event was not saved.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your event was not saved.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your event was not saved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOnReset = () => {
    setOpenDialog(false)
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="icon" onClick={handleOpenDialog} variant="secondary"><Icons.save className="h-5 w-5"/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to save this &quot;{event?.name}&quot; event ?</DialogTitle>
          <DialogDescription/>
          <DialogFooter>
            <Button onClick={handleOnReset} variant="secondary">Cancel</Button>
            <Button onClick={handleOnSave} disabled={isSaving}>Save</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}