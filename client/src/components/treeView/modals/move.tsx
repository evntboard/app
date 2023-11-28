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

type FormDataFolder = z.infer<typeof validFolderNameSchema>

export const MoveModal = ({organizationId, entity, action, onClose}: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  const form = useForm<FormDataFolder>({
    resolver: zodResolver(validFolderNameSchema),
    defaultValues: {
      name: entity?.slug.length === 1 ? entity?.slug: entity?.slug.slice(0, -1) + "-new/"
    },
  })

  const handleOk = async (data: FormDataFolder) => {
    setIsSaving(true)
    try {
      switch (entity.type) {
        case "folder":
          await ky.get(`/api/organization/${organizationId}/tree/move?path=${entity.slug}&target-path=${data.name}`)
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
    <Dialog open={action === 'move'} onOpenChange={onClose}>
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
        <TreeView
          node={entity}
        />
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