import { useFetcher } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { cn } from '~/utils/cn'
import { TreeNodeAction, TreeNodeType } from '~/types/tree'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { triggerConditionCreateFormSchema } from '~/validation/trigger'
import { ComboboxCreate, ComboboxOptions } from '~/components/combobox-create'
import { usePocketBase } from '~/hook/usePocketBase'

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const CreateConditionModal = ({ entity, organizationId, action, onClose }: Props) => {
  const pb = usePocketBase()
  const [options, setOptions] = useState<Array<ComboboxOptions>>([])
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()
  const resolver = zodResolver(triggerConditionCreateFormSchema)
  const form = useForm<z.infer<typeof triggerConditionCreateFormSchema>>({
    resolver,
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = (data: z.infer<typeof triggerConditionCreateFormSchema>) => {
    fetcher.submit(
      {
        ...data,
        _action: 'create',
      },
      {
        action: `/organizations/${organizationId}/script/trigger/${entity.id}/conditions`,
        method: 'POST',
        encType: 'application/json',
      },
    )
  }

  const test = async () => {
    try {
      const resultList: Array<string> | undefined = await pb?.send(
        `/api/organization/${organizationId}/event/available`,
        { method: 'GET', },
      )

      setOptions(resultList?.map((name) => ({ value: name, label: name })) ?? [])
    } catch (e) {
      setOptions([])
    }
  }

  useEffect(() => {
    if (action === 'create-condition') {
      test()
    }
  }, [action])

  useEffect(() => {
    if (fetcher.data?.errors) {
      Object.entries(fetcher.data?.errors)
        .forEach(([name, error]) => {
          form.setError(name as never, { message: error.message })
        })
    }
  }, [fetcher.data, form])

  useEffect(() => {
    if (fetcher.state === 'loading' && !fetcher.data?.errors) {
      onClose()
    }
  }, [fetcher.state, fetcher.data, onClose])

  return (
    <Dialog open={action === 'create-condition'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <DialogHeader>
              <DialogTitle>Add a condition to trigger</DialogTitle>
              <DialogDescription>
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <ComboboxCreate
                      onChange={field.onChange}
                      value={field.value}
                      options={options}
                      placeholder="Select or use an event ..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fetcher.data?.errors?.global && (
              <p className={cn('text-sm font-medium text-destructive')}>
                {fetcher.data?.errors?.global?.message}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" className="flex gap-2">
                Create
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