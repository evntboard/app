"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";

import {storageSchema} from "@/lib/validations/storage";
import {cn, jsonParse} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {toast} from "@/components/ui/use-toast";
import {Icons} from "@/components/icons";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Editor} from "@/components/editor";

type FormData = z.infer<typeof storageSchema>

type Props = {
  organizationId: string,
  defaultValues: FormData,
  isCreating?: boolean,
}

export const StorageForm = ({organizationId, defaultValues, isCreating = false}: Props) => {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(storageSchema),
    defaultValues: {
      key: defaultValues.key,
      value: JSON.stringify(defaultValues.value, undefined, 2),
    },
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    try {
      await ky.post(`/api/organization/${organizationId}/storage`, {
        json: {
          key: data.key,
          value: jsonParse(data.value),
        }
      })

      toast({
        description: "Storage saved",
      })

      router.refresh()
      router.push(`/organization/${organizationId}/storages`);
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your storage was not saved.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your storage was not saved.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your storage was not saved. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-2 px-1')}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="key"
          render={({field}) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input placeholder="Key" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({field}) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Editor
                  language='json'
                  height='300px'
                  {...field}
                />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage/>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}