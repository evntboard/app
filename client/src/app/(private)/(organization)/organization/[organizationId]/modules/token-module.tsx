"use client"

import * as React from "react";
import {useParams} from "next/navigation";
import ky from "ky";

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
import {Module} from "@prisma/client";

type Props = {
  module: Module,
}

export const TokenModule = ({module}: Props) => {
  const {organizationId} = useParams()
  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const handleOpenDialog = (e: any) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  const handleCopyToken = async () => {
    setIsSaving(true)
    try {
      const res = await ky.get(`/api/organization/${organizationId}/module/${module.id}/token`)
      const json: { token: string } = await res.json()
      await window.navigator.clipboard.writeText(json.token)
      toast({
        description: "Token copied !",
      })
    } catch (e) {
      toast({
        description: "Error on getting token",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshToken = async () => {
    setIsSaving(true)
    try {
      await ky.get(`/api/organization/${organizationId}/module/${module.id}/refresh-token`)
      toast({
        description: "Token refresh !",
      })
    } catch (e) {
      toast({
        description: "Error on refresh token",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="icon" onClick={handleOpenDialog} variant="secondary"><Icons.token className="h-5 w-5"/></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token for [{module.code}]{module.name} module ?</DialogTitle>
          <DialogDescription>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={handleRefreshToken}
              disabled={isSaving}
              variant="destructive"
            >
              {isSaving && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
              )}
              Refresh token
            </Button>
            <Button
              onClick={handleCopyToken}
              disabled={isSaving}
            >
              {isSaving && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
              )}
              Copy token
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}