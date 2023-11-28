"use client"

import * as React from "react";
import {useState} from "react";
import ky from "ky";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {toast} from "@/components/ui/use-toast";
import {Icons} from "@/components/icons";

type Props = {
  organizationId: string,
  currentUserId: string,
  user: {
    id: string,
    name: string | null,
  }
}

export const RemoveUserFromOrganization = (props: Props) => {
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleDelete = async (e: any) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await ky.delete(`/api/organization/${props.organizationId}/user/${props.user.id}`)
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast({
        title: "Cannot find any user for this orga"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button>
          {props.currentUserId === props.user.id ? "Delete" : "Leave" }
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure to remove {props.user.name} from organization ?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleDelete}>
              {isSaving && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
              )}
              Continue
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
