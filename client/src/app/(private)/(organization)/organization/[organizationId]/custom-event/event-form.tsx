"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";

import {Button} from "@/components/ui/button";
import {toast} from "@/components/ui/use-toast";
import {cn, jsonParse} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Editor} from "@/components/editor";
import {JsonValue} from "@prisma/client/runtime/library";
import {Textarea} from "@/components/ui/textarea";

const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  payload: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  }),
})


type FormData = z.infer<typeof eventSchema>

type Props = {
  organizationId: string,
  defaultValues: { id?: string, name: string, description: string, payload: JsonValue },
}

export const EventForm = ({organizationId, defaultValues}: Props) => {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      id: defaultValues.id,
      name: defaultValues.name,
      description: defaultValues.description,
      payload: JSON.stringify(defaultValues.payload, undefined, 2)
    },
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    try {
      if (defaultValues.id) {
        await ky.patch(`/api/organization/${organizationId}/custom-event/${defaultValues.id}`, {
          json: {
            name: data.name,
            description: data.description,
            payload: jsonParse(data.payload),
          }
        })
      } else {
        await ky.post(`/api/organization/${organizationId}/custom-event`, {
          json: {
            name: data.name,
            description: data.description,
            payload: jsonParse(data.payload),
          }
        })
      }

      toast({
        description: "Event sent.",
      })

      router.push(`/organization/${organizationId}/custom-events`)
      router.refresh()
    } catch (e) {
      if (e instanceof HTTPError) {
        switch (e.response.status) {
          case 422:
            toast({
              title: "Provided data are not right",
              description: "Your event was not created.",
              variant: "destructive",
            })
            break;
          case 402:
            toast({
              title: "Something went wrong.",
              description: "Your event was not created.",
              variant: "destructive",
            })
            break;
        }
      }
      toast({
        title: "Something went wrong.",
        description: "Your event was not created. Please try again.",
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
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="my-event" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A sample event with a random data"
                  {...field}
                />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <div className="flex flex-col mb-2">
          <FormField
            control={form.control}
            name="payload"
            render={({field}) => (
              <FormItem>
                <FormLabel>Payload</FormLabel>
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
        </div>
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