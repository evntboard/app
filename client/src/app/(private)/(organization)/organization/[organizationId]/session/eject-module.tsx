"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
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
import {toast} from "@/components/ui/use-toast";

type Props = {
  session: { id: string },
}

export const EjectModule = ({session}: Props) => {
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
      await ky.delete(`/api/organization/${organizationId}/session/${session.id}`)

      toast({
        description: "Module ejected",
      })
      setOpenDialog(false)
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your module was not ejected.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your module was not ejected.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your module was not ejected. Please try again.",
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
          <DialogTitle>Do you want to eject this &quot;{session?.id}&quot; module ?</DialogTitle>
          <DialogDescription/>
          <DialogFooter>
            <Button onClick={handleOnReset} variant="secondary">Cancel</Button>
            <Button onClick={handleOnSave} disabled={isSaving} variant="destructive">Eject</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}