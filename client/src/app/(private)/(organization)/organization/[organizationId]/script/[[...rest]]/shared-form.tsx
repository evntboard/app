"use client"

import * as React from "react"
import {useRouter} from "next/navigation"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import * as z from "zod"
import ky, {HTTPError} from "ky"

import {cn} from "@/lib/utils"
import {buttonVariants} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {toast} from "@/components/ui/use-toast"
import {Icons} from "@/components/icons"
import {Shared} from "@prisma/client"
import {sharedSchema} from "@/lib/validations/shared";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Editor} from "@/components/editor";

interface Props extends React.HTMLAttributes<HTMLFormElement> {
  entity: Shared,
  organizationId: string
}

type FormData = z.infer<typeof sharedSchema>

export function SharedForm({className, entity, organizationId, ...props}: Props) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(sharedSchema),
    defaultValues: {
      name: entity?.name ?? "/my-shared",
      code: entity?.code ?? "// type your code here",
      enable: entity?.enable ?? false
    },
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    try {

      let response
      if (entity?.id) {
        response = await ky.patch(`/api/organization/${organizationId}/shared/${entity?.id}`, {
          json: {
            name: data.name,
            code: data.code,
            enable: data.enable,
          }
        })
      } else {
        response = await ky.post(`/api/organization/${organizationId}/shared`, {
          json: {
            name: data.name,
            code: data.code,
            enable: false,
          }
        })
      }

      const rez: Shared = await response.json()

      toast({
        description: "Your organization has been created.",
      })

      if (!entity?.id) {
        router.push(`/organization/${organizationId}/script/shared/${rez.id}`)
      }

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

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-2 h-full  px-1', className)}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        <div>
          <button
            type="submit"
            className={cn(buttonVariants(), className)}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            <span>Save</span>
          </button>
        </div>
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
        <div className="flex flex-col flex-1 mb-2">
          <FormField
            control={form.control}
            name="code"
            render={({field}) => (
              <Editor
                language='javascript'
                height='100%'
                {...field}
              />
            )}
          />
        </div>
      </form>
    </Form>
  )
}
