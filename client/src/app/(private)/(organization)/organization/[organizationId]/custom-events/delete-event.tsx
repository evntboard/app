"use client"

import * as React from "react";

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
import {CustomEvent} from "@prisma/client";
import ky, {HTTPError} from "ky";
import {toast} from "@/components/ui/use-toast";
import {useRouter} from "next/navigation";

type Props = {
  event: CustomEvent,
}

export const DeleteEvent = ({event}: Props) => {
  const router = useRouter()
  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOpenDialog = (e: any) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  const handleOnSave = async () => {
    try {
      setIsSaving(true)
      await ky.delete(`/api/organization/${event.organizationId}/custom-event/${event.id}`)

      toast({
        description: "Custom event deleted",
      })
      setOpenDialog(false)
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your custom event was not deleted.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your custom event was not deleted. Please try again.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your custom event was not deleted. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      router.refresh()
    }
  }

  const handleOnReset = () => {
    setOpenDialog(false)
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="icon" onClick={handleOpenDialog} variant="destructive">
          <Icons.delete className="h-5 w-5"/>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to delete this &quot;{event?.name}&quot; custom event ?</DialogTitle>
          <DialogDescription/>
          <DialogFooter>
            <Button onClick={handleOnReset} variant="secondary">Cancel</Button>
            <Button onClick={handleOnSave} disabled={isSaving} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}