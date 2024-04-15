import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSubmit } from '@remix-run/react'

import { cn } from '~/utils/cn'
import { TimePickerDemo } from '~/components/timepicker/timepicker'
import { Button, buttonVariants } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'

const formSchema = z.object({
  name: z.string(),
  emitterCode: z.string(),
  emitterName: z.string(),
  emittedAtStart: z.date(),
  emittedAtEnd: z.date(),
})


type FormSchemaType = z.infer<typeof formSchema>;

type Props =  {
  organizationId: string
  defaultValues: {
    name: string
    emitterCode: string
    emitterName: string
    emittedAtStart: Date
    emittedAtEnd: Date
  }
}

export function FormEventsSearch({ organizationId, defaultValues }: Props) {
  const submit = useSubmit()

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  const onSubmit = (d: FormSchemaType) => {
    submit(
      {
        name: d.name,
        emitterCode: d.emitterCode,
        emitterName: d.emitterName,
        emittedAtStart: d.emittedAtStart.toISOString(),
        emittedAtEnd: d.emittedAtEnd.toISOString(),
      },
      {
        action: `/organizations/${organizationId}/events`,
        method: 'get',
      },
    )
  }

  return (
    <Form {...form}>
      <form
        className="grid items-end gap-4 justify-center grid-cols-3 p-1"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="increment" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emitterCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module code</FormLabel>
              <FormControl>
                <Input placeholder="board" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emitterName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module name</FormLabel>
              <FormControl>
                <Input placeholder="board" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emittedAtStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emitted Start</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, 'PPP HH:mm:ss')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <TimePickerDemo
                      setDate={field.onChange}
                      date={field.value}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emittedAtEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emitted End</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, 'PPP HH:mm:ss')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <TimePickerDemo
                      setDate={field.onChange}
                      date={field.value}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex mb-2 gap-2">
          <Link
            to={`/organizations/${organizationId}/events`}
            className={cn('grow', buttonVariants({variant: "outline"}))}
          >
            Reset
          </Link>
          <Button className="grow" type="submit">Search</Button>
        </div>
      </form>
    </Form>
  )
}