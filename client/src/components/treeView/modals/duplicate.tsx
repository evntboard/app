import React from "react";
import ky, {HTTPError} from "ky";
import * as z from "zod";
import {useForm} from "react-hook-form";
import {useRouter} from "next/navigation";
import {zodResolver} from "@hookform/resolvers/zod";

import {TreeNodeType} from "@/types/tree-node";
import {cn} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {toast} from "@/components/ui/use-toast";
import {Icons} from "@/components/icons";
import {TreeView} from "@/components/treeView/TreeView";
import {Input} from "@/components/ui/input";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

const validFolderNameSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+\/$/.test(value), 'Name should be a path'),
})

const validScriptNameSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+$/.test(value), 'Name should be a path'),
})


type FormDataScript = z.infer<typeof validScriptNameSchema>
type FormDataFolder = z.infer<typeof validFolderNameSchema>

export const DuplicateModal = ({organizationId, entity, action, onClose}: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const form = useForm<FormDataFolder | FormDataScript>({
    resolver: zodResolver(entity.type === 'folder' ? validFolderNameSchema : validScriptNameSchema),
    defaultValues: {
      name: entity.type === 'folder' ? entity?.slug + "dup/" : entity?.slug + "-dup",
    },
  })

  const handleOk = async (data: FormDataFolder | FormDataScript) => {
    setIsSaving(true)
    try {
      switch (entity.type) {
        case "shared": {
          await ky.get(`/api/organization/${organizationId}/shared/${entity?.id}/duplicate?target-path=${data.name}`)
          break;
        }
        case "trigger": {
          await ky.get(`/api/organization/${organizationId}/trigger/${entity?.id}/duplicate?target-path=${data.name}`)
          break;
        }
        case "folder":
          await ky.get(`/api/organization/${organizationId}/tree/duplicate?path=${entity.slug}&target-path=${data.name}`)
          break;
      }
      onClose()
    } catch (e) {
      if (e instanceof HTTPError) {
        toast({
          title: "Something went wrong.",
          description: "Your organization was not created. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={action === 'duplicate'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate {entity.type}</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className={cn('flex flex-col gap-2 h-full')}
            onSubmit={form.handleSubmit(handleOk)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="/constants" {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage/>
                </FormItem>
              )}
            />
          </form>
        </Form>
        {entity.type === 'folder' && (
          <TreeView
            node={entity}
          />
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={form.handleSubmit(handleOk)}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            Do it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}