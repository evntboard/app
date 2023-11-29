"use client"

import * as React from "react"
import {useState} from "react"
import {usePathname, useRouter, useSearchParams} from "next/navigation"
import {zodResolver} from "@hookform/resolvers/zod"
import {useFieldArray, useForm} from "react-hook-form"
import * as z from "zod"
import ky, {HTTPError} from "ky";
import {Shared, Trigger} from "@prisma/client"


import {triggerSchema} from "@/lib/validations/trigger";
import {cn} from "@/lib/utils"
import {Button, buttonVariants} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {toast} from "@/components/ui/use-toast"
import {Icons} from "@/components/icons"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Editor} from "@/components/editor";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,} from "@/components/ui/context-menu"
import {Badge} from "@/components/ui/badge"

interface Props extends React.HTMLAttributes<HTMLFormElement> {
  entity: Trigger,
  organizationId: string
}

type FormData = z.infer<typeof triggerSchema>

export function TriggerForm({className, entity, organizationId, ...props}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      name: entity?.name ?? "/my-trigger",
      enable: entity?.enable ?? false,
      channel: entity?.channel ?? "",
      code: entity?.code ?? "// type your code here",
      // @ts-ignore
      conditions: entity?.conditions ?? []
    },
  })

  const {fields, append, remove, update} = useFieldArray({
    control: form.control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'conditions' // unique name for your Field Array
  })

  const [isSaving, setIsSaving] = useState<boolean>(false)

  const handleSetSelected = (data?: string) => {
    const urlSearchParams = new URLSearchParams(searchParams?.toString());
    if (data) {
      urlSearchParams.set("c", data)
    } else {
      urlSearchParams.delete("c")
    }
    const search = urlSearchParams.toString();
    const query = search ? `?${search}` : '';
    router.replace(`${pathname}${query}`);
  }

  async function onSubmit(data: FormData) {
    setIsSaving(true)
    try {
      let response
      if (entity?.id) {
        response = await ky.patch(`/api/organization/${organizationId}/trigger/${entity?.id}`, {
          json: {
            name: data.name,
            code: data.code,
            enable: data.enable,
            channel: data.channel,
            conditions: data.conditions?.map((condition) => ({
              id: condition.id,
              name: condition.name,
              enable: condition.enable,
              code: condition.code,
              type: condition.type,
              timeout: condition.timeout,
            })) ?? []
          }
        })
      } else {
        response = await ky.post(`/api/organization/${organizationId}/trigger`, {
          json: {
            name: data.name,
            code: data.code,
            enable: false,
            channel: data.channel,
            conditions: data.conditions?.map((condition) => ({
              name: condition.name,
              enable: false,
              code: condition.code,
              type: condition.type,
              timeout: condition.timeout,
            })) ?? []
          }
        })
      }

      const rez: Shared = await response.json()

      toast({
        description: "Your trigger has been created.",
      })

      if (!entity?.id) {
        router.push(`/organization/${organizationId}/script/trigger/${rez.id}`)
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

  const hasNewCondition = form.watch(`conditions`).find(({name}) => name === "new")

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-1 flex-col gap-2 px-1', className)}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        <div>
          <button
            type="submit"
            className={cn(buttonVariants())}
            disabled={isSaving}
          >
            {isSaving && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin"/>
            )}
            <span>Save</span>
          </button>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <FormField
            control={form.control}
            name="name"
            render={({field}) => (
              <FormItem className="flex-1">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="/constants" {...field} />
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage/>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="channel"
            render={({field}) => (
              <FormItem className="flex-1">
                <FormLabel>Channel</FormLabel>
                <FormControl>
                  <Input placeholder="animations" {...field} />
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage/>
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => handleSetSelected()}>Reaction</Button>
          {
            ...fields?.map((field, index) => {
              const currentData = form.watch(`conditions.${index}`)
              return (
                <ContextMenu key={`conditions.${index}`}>
                  <ContextMenuTrigger>
                    <div
                      className={cn(buttonVariants(), className, "flex gap-1 cursor-pointer")}
                      onClick={() => handleSetSelected(currentData.name)}
                    >
                      {!currentData.enable && (<Badge variant="destructive">OFF</Badge>)}
                      {currentData.enable && (<Badge variant="success">ON</Badge>)}
                      {currentData.name}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {currentData.enable && (
                      <ContextMenuItem onClick={() => update(index, {...currentData, enable: false})}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                          <div><Icons.disable className="h-5"/></div>
                          Disable
                        </div>
                      </ContextMenuItem>
                    )}
                    {!currentData.enable && (
                      <ContextMenuItem onClick={() => update(index, {...currentData, enable: true})}>
                        <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                          <div><Icons.enable className="h-5"/></div>
                          Enable
                        </div>
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => remove(index)}>
                      <div className='flex flex-1 gap-2 items-center cursor-pointer'>
                        <div><Icons.delete className="h-5"/></div>
                        Delete
                      </div>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            })
          }
          <Button
            type="button"
            size="icon"
            disabled={!!hasNewCondition}
            onClick={() => {
              append({
                enable: false,
                name: 'new',
                code: '',
                timeout: 0,
                type: 'BASIC'
              })
              handleSetSelected('new')
            }}
          >
            <Icons.add />
          </Button>
        </div>
        <div className="flex flex-col flex-1 mb-2 border p-4 rounded-md">
          {
            !searchParams.get('c') && (
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
            )
          }
          {
            ...fields?.map((field, index) => {
              if (field.name !== searchParams.get('c')) {
                return null
              }

              return (
                <>
                  <div className="flex flex-col gap-2 lg:flex-row">
                    <FormField
                      control={form.control}
                      name={`conditions.${index}.name`}
                      render={({field}) => (
                        <FormItem className="flex-1">
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="/constants" {...field} />
                          </FormControl>
                          <FormDescription></FormDescription>
                          <FormMessage/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`conditions.${index}.type`}
                      render={({field}) => (
                        <FormItem className="flex-1">
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BASIC">Basic</SelectItem>
                              <SelectItem value="THROTTLE">Throttle</SelectItem>
                              <SelectItem value="DEBOUNCE">Debounce</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription></FormDescription>
                          <FormMessage/>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`conditions.${index}.timeout`}
                      render={({field}) => (
                        <FormItem className="flex-1">
                          <FormLabel>Timeout</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="/constants"
                              {...field}
                              onChange={(e) => {
                                const number = parseInt(e.target.value, 10)
                                if (isNaN(number)) {
                                  field.onChange(e.target.value)
                                } else {
                                  field.onChange(number)
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription></FormDescription>
                          <FormMessage/>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`conditions.${index}.code`}
                    render={({field}) => (
                      <Editor
                        language='javascript'
                        height='100%'
                        {...field}
                      />
                    )}
                  />
                </>
              )
            })
          }
        </div>
      </form>
    </Form>
  )
}
