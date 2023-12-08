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
import {Module} from "@prisma/client";

type Props = {
  module: Module,
}

export const DeleteModule = ({module}: Props) => {
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
      await ky.delete(`/api/organization/${organizationId}/module/${module.id}`)

      toast({
        description: "Module deleted",
      })
      setOpenDialog(false)
      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your module was not deleted.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your module was not deleted.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your module was not deleted. Please try again.",
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
        <Button size="icon" onClick={handleOpenDialog} variant="destructive"><Icons.delete className="h-5 w-5"/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to delete [{module.code}]{module.name} module ?</DialogTitle>
          <DialogDescription/>
          <DialogFooter>
            <Button variant="secondary" onClick={handleOnReset}>Cancel</Button>
            <Button variant="destructive" onClick={handleOnSave} disabled={isSaving}>Delete</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}