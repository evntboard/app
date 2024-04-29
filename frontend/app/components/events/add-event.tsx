import { useFetcher } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect, useState } from 'react'

import { useDebounceCallback } from 'usehooks-ts'
import { Check, ChevronsUpDown } from 'lucide-react'

import { getAvatarUrl } from '~/utils/avatar'
import { cn } from '~/utils/cn'
import { eventCreateFormSchema } from '~/validation/event'
import { Collections, CustomEventsResponse, OrganizationsResponse } from '~/types/pocketbase'
import { Button } from '~/components/ui/button'
import { AvatarPb } from '~/components/avatar-pb'
import { Input } from '~/components/ui/input'
import { Icons } from '~/components/icons'
import { Editor } from '~/components/editor'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useRootContext } from '~/context/root';
import { usePocketBase } from '~/hook/usePocketBase';

type Props = {
  organization: OrganizationsResponse,
}

export const AddEvent = ({ organization }: Props) => {
  const rootContext = useRootContext()
  const pb = usePocketBase()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false)

  const [selectedEvent, setSelectedEvent] = useState<string | undefined>(undefined)
  const [options, setOptions] = useState<Array<CustomEventsResponse>>([])
  const [openSearch, setOpenSearch] = useState(false)

  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const searchCustomEvent = async (search: string) => {
    setIsLoading(true)
    try {
      const customEvents = await pb
        ?.collection(Collections.CustomEvents)
        .getFullList<CustomEventsResponse>(
          {
            filter: `organization.id = "${organization.id}" && (name ~ "${search}" || description ~ "${search}")`,
            sort: '+created',
          },
        )

      if (customEvents) {
        setOptions(customEvents)
      }
    } catch (e) {
      setOptions([])
    }
    setIsLoading(false)
  }

  const debouncedSearch = useDebounceCallback(searchCustomEvent, 500)

  const resolver = zodResolver(eventCreateFormSchema)
  const form = useForm<z.infer<typeof eventCreateFormSchema>>({
    resolver,
    defaultValues: {
      name: '',
      payload: JSON.stringify({ answer: 42 }, null, 2),
    },
  })

  const onSubmit = (data: z.infer<typeof eventCreateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'create',
      },
      {
        action: `/organizations/${organization.id}/events`,
        method: 'POST',
        encType: 'application/json',
      },
    )
  }

  useEffect(() => {
    if (fetcher.data?.errors) {
      Object.entries(fetcher.data?.errors)
        .forEach(([name, error]) => {
          form.setError(name as never, { message: error.message })
        })
    }
  }, [fetcher.data, form])


  useEffect(() => {
    if (fetcher.state === 'loading') {
      setOpen(false)
    }
  }, [fetcher.state])

  useEffect(() => {
    form.reset({
      name: '',
      payload: JSON.stringify(null, null, 2),
    })
    setSelectedEvent(undefined)
    setOptions([])
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2"><Icons.create className="h-4 w-4" /> Send new</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            Send a new event to
            <AvatarPb url={getAvatarUrl(rootContext.API_URL, organization)} />
            {organization.name}
          </DialogTitle>
          <DialogDescription>
            Search for a custom event or write it yourself
          </DialogDescription>
        </DialogHeader>
        <Popover open={openSearch} onOpenChange={setOpenSearch}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSearch}
              className="w-full justify-between"
            >
              {selectedEvent
                ? options.find((customEvent) => customEvent.id === selectedEvent)?.name
                : 'Select custom event...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command shouldFilter={false}>
              <CommandList>
                <CommandInput placeholder="Search custom event..." onValueChange={debouncedSearch} />
                {!isLoading && <CommandEmpty>No custom event found.</CommandEmpty>}
                {isLoading && <CommandEmpty>Loading ....</CommandEmpty>}
                <CommandGroup>
                  {options.map((customEvent) => (
                    <CommandItem
                      key={customEvent.id}
                      value={customEvent.id}
                      onSelect={(currentValue) => {
                        if (currentValue === selectedEvent) {
                          setSelectedEvent(undefined)
                          form.reset({
                            name: '',
                            payload: JSON.stringify(null, null, 2),
                          })
                        } else {
                          setSelectedEvent(currentValue)
                          form.reset({
                            name: customEvent.name,
                            payload: JSON.stringify(customEvent.payload ?? null, null, 2),
                          })
                        }
                        setOpenSearch(false)
                      }}
                      className="flex gap-2 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          selectedEvent === customEvent.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="shrink-0">{customEvent.name}</span>
                      <Tooltip>
                        <TooltipTrigger className="truncate">{customEvent.description}</TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          {customEvent.description}
                        </TooltipContent>
                      </Tooltip>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Form {...form}>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="increment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full h-[300px]">
              <FormField
                control={form.control}
                name="payload"
                render={({ field }) => (
                  <Editor
                    onChange={field.onChange}
                    value={field.value}
                    language="json"
                    height="100%"
                  />
                )}
              />
            </div>
            {fetcher.data?.errors?.global && (
              <p className={cn('text-sm font-medium text-destructive')}>
                {fetcher.data?.errors?.global?.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="flex gap-2">
                Send
                <Icons.loader
                  className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
                />
              </Button>
            </DialogFooter>
          </fetcher.Form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}