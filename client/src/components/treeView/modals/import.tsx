import React from "react";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import ky, {HTTPError} from "ky";

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input"
import {TreeNodeAction} from "@/components/treeView/TreeNode";
import {Icons} from "@/components/icons";
import {toast} from "@/components/ui/use-toast";
import {TreeNodeType} from "@/types/tree-node";
import {importSchema, importSharedSchema, importTriggerSchema} from "@/lib/validations/import";
import {cn} from "@/lib/utils";

type Props = {
  hasWriteAccess: boolean,
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

type FormData = z.infer<typeof importSchema>
type ExportedTrigger = z.infer<typeof importTriggerSchema>
type ExportedShared = z.infer<typeof importSharedSchema>

export const ImportModal = ({entity, action, onClose, hasWriteAccess, organizationId}: Props) => {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      slug: entity.slug,
      files: undefined
    },
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    let mergedData: { triggers: Array<ExportedTrigger>, shareds: Array<ExportedShared> } = {
      triggers: [],
      shareds: []
    }

    for (const file of data.files) {
      if (file instanceof File) {
        try {
          const strData = await file.text()
          const json: {
            triggers: Array<ExportedTrigger>,
            shareds: Array<ExportedShared>
          } | undefined = JSON.parse(strData)

          if (json?.shareds && json?.shareds.length > 0) {
            mergedData.shareds.push(
              ...json.shareds
                .filter((i) => !mergedData.shareds.map(({name}) => name).includes(i.name))
                .map((i) => ({
                  code: i.code,
                  name: i.name
                }))
            )
          }

          if (json?.triggers) {
            mergedData.triggers.push(
              ...json.triggers
                .filter((i) => !mergedData.triggers.map(({name}) => name).includes(i.name))
                .map((i) => ({
                  name: i.name,
                  code: i.code,
                  channel: i.channel,
                  conditions: i.conditions.map((j) => ({
                    code: j.code,
                    name: j.name,
                    timeout: j.timeout,
                    type: j.type
                  }))
                }))
            )
          }
        } catch (e) {
          console.error(`omit ${file.name} cause JSON is not well formatted`)
        }
      }
    }

    try {
      await ky.post(`/api/organization/${organizationId}/tree/import`, {
        json: mergedData
      })

      toast({
        description: "Event sent",
      })

      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your event was not sent.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your event was not sent.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your event was not sent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={action === 'import'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import</DialogTitle>
          <DialogDescription>
            If a trigger / shared has the same name as another, only the first encounter will be saved.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className={cn('flex flex-col gap-2 h-full  px-1')}
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="slug"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="/" {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="files"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Files</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => {
                        field.onChange(e.target.files);
                      }}
                      accept=".json"
                    />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage></FormMessage>
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !hasWriteAccess}
              >
                {isSaving && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
                )}
                Send
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}