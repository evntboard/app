"use client"

import * as React from "react";
import ky, {HTTPError} from "ky";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

import {JsonValue} from "@prisma/client/runtime/library";

import {cn, jsonParse} from "@/lib/utils";
import {toast} from "@/components/ui/use-toast";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Editor} from "@/components/editor";
import {Button} from "@/components/ui/button";
import {Icons} from "@/components/icons";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

type Props = {
  hasWriteAccess: boolean,
  organizationId: string,
  events: { id: string; name: string; payload: JsonValue; }[],
}

const eventSchema = z.object({
  name: z.string(),
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

export const AddEvent = ({hasWriteAccess, organizationId, events}: Props) => {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "my-event",
      payload: JSON.stringify({"random": Math.random()}, undefined, 2)
    },
  })

  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function onSubmit(data: FormData) {
    setIsSaving(true)

    try {
      await ky.post(`/api/organization/${organizationId}/realtime-event`, {
        json: {
          name: data.name,
          payload: jsonParse(data.payload)
        }
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

  const onEventIdChange = (data: string) => {
    if (data !== "none") {
      const event = events.find((event) => event.id === data)

      form.setValue('name', event?.name ?? "");
      form.setValue('payload', JSON.stringify(event?.payload ?? "{}", undefined, 2));
    } else {
      form.setValue('name', "my-event");
      form.setValue('payload', JSON.stringify({"random": Math.random()}, undefined, 2));
    }
  }

  return (
    <>
      <div>
        <Select onValueChange={onEventIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
          <div className="flex flex-col flex-1 mb-2">
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
          <div>
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
    </>
  )
}