"use client"

import * as React from "react";
import {useParams, useRouter} from "next/navigation";

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
import ky, {HTTPError} from "ky";
import {toast} from "@/components/ui/use-toast";

type Props = {
  storageKey: string,
}

export const DeleteStorage = ({storageKey}: Props) => {
  const router = useRouter()
  const { organizationId } = useParams()
  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOpenDialog = (e: any) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  const handleOnSave = async () => {
    try {
      setIsSaving(true)
      await ky.delete(`/api/organization/${organizationId}/storage/${storageKey}`)

      toast({
        description: "Event sent",
      })
      setOpenDialog(false)
      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your trigger was not created. Pro plan is required.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your organization was not created. Pro plan is required.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your organization was not created. Please try again.",
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
        <Button size="icon" onClick={handleOpenDialog}><Icons.delete className="h-5 w-5"/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to delete this &quot;{storageKey}&quot; storage ?</DialogTitle>
          <DialogDescription/>
          <DialogFooter>
            <Button onClick={handleOnReset}>Cancel</Button>
            <Button variant="destructive" onClick={handleOnSave} disabled={isSaving}>Delete</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}