"use client"

import * as React from "react";
import {useEffect, useRef} from "react";
import ky, {HTTPError} from "ky";
import debounce from "lodash/debounce";
import {useRouter} from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {toast} from "@/components/ui/use-toast";
import {Input} from "@/components/ui/input";
import {Icons} from "@/components/icons";
import {UserAvatar} from "@/components/user-avatar";
import {Organization} from "@prisma/client";

type Props = {
  hasWriteAccess: boolean,
  organization: Organization,
}

type UserOption = { id: string, name?: string, image?: string }

export const AddMembers = ({hasWriteAccess, organization}: Props) => {
  const router = useRouter()

  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isSaving, setIsSaving] = React.useState<boolean>(false)
  const [search, setSearch] = React.useState<string>("")
  const [selectedUser, setSelectedUser] = React.useState<UserOption | undefined>(undefined)
  const [options, setOptions] = React.useState<UserOption[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = React.useState<boolean>(false)

  const debouncedSearch = useRef(
    debounce(async (search: string) => {
      if (search.length >= 3) {
        setIsLoadingOptions(true)
        try {
          const res = await ky.get(`/api/organization/${organization.id}/user?search=${search}`)
          const datas: UserOption[] = await res.json()
          setOptions(datas)
        } catch (e) {
          toast({
            title: "Cannot find any user for this orga"
          })
        } finally {
          setIsLoadingOptions(false)
        }
      }
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (innerSearch: string) => {
    setSearch(innerSearch)
    debouncedSearch(innerSearch);
  }

  async function handleInvite() {
    setIsSaving(true)

    try {
      await ky.post(`/api/organization/${organization.id}/user`, {
        json: {userId: selectedUser?.id}
      })

      toast({
        description: "Your members was added.",
      })

      setOpenDialog(false)

      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your members was not added.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your members was not added.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your members was not added. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setSelectedUser(undefined)
      setSearch('')
    }
  }

  const handleOpenDialog = (e: any) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          onClick={handleOpenDialog}
          disabled={!hasWriteAccess}
        >
          <Icons.create className="mr-2 h-4 w-4"/>
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member to {organization.name}</DialogTitle>
          <DialogDescription/>
        </DialogHeader>
        Search by username
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Icons.search className="h-4 w-4"/>
            <Input
              placeholder="Type a command or search..."
              value={selectedUser ? selectedUser.name : search}
              onChange={(e) => handleInputChange(e.target.value)}
            />
            <Button disabled={isSaving || !selectedUser} onClick={handleInvite}>Invite</Button>
          </div>
          {
            isLoadingOptions && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )
          }
          {
            !isLoadingOptions && options?.map((option) => {
              const selectUser = () => {
                setSelectedUser(option)
                setOptions([])
              }
              return (
                <div key={option.id} className="flex flex-1 items-center gap-2 p-3 rounded border" onClick={selectUser}>
                  <UserAvatar
                    user={{ name: option.name || null, image: option.image || null }}
                    className="h-8 w-8"
                  />
                  <span>{option.name}</span>
                </div>
              )
            })
          }
        </div>
      </DialogContent>
    </Dialog>
  )
}