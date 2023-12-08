"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
import {useRouter} from "next/navigation";
import {useFieldArray, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";

import {Button} from "@/components/ui/button";
import {toast} from "@/components/ui/use-toast";
import {cn} from "@/lib/utils";
import {moduleSchema} from "@/lib/validations/module";
import {Icons} from "@/components/icons";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";

type FormData = z.infer<typeof moduleSchema>

type Props = {
  organizationId: string,
  defaultValues: FormData,
}

export const ModuleForm = ({organizationId, defaultValues}: Props) => {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues,
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'params' // unique name for your Field Array
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    try {
      if (data.id) {
        await ky.patch(`/api/organization/${organizationId}/module/${data.id}`, {
          json: {
            name: data.name,
            code: data.code,
            params: data.params
          }
        })
      } else {
        await ky.post(`/api/organization/${organizationId}/module`, {
          json: {
            name: data.name,
            code: data.code,
            params: data.params
          }
        })
      }

      toast({
        description: "module sent",
      })

      router.push(`/organization/${organizationId}/modules`)
      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your module was not created.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your module was not created. Please try again.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your module was not created. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-2 h-full  px-1')}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="code"
          render={({field}) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="Your module group" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your module instance name" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage/>
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <div>Params</div>
          <Button
            type="button"
            size="icon"
            onClick={() => {
              append({
                key: 'key',
                value: '',
              })
            }}
          >
            <Icons.add/>
          </Button>
        </div>
        {...fields?.map((field, index) => {
          return (
            <div key={`params.${index}`} className="flex flex-col gap-2 lg:flex-row p-2 items-center">
              <FormField
                control={form.control}
                name={`params.${index}.key`}
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input placeholder="token" {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`params.${index}.value`}
                render={({field}) => (
                  <FormItem className="flex-1">
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="a random data" {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div>
                <Button type="button" onClick={() => remove(index)}>Delete</Button>
              </div>
            </div>
          )
        })}
        <div>
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