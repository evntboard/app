import { useFetcher } from 'react-router-dom'
import { useEffect } from 'react'
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
import { Input } from '~/components/ui/input'
import { cn } from '~/utils/cn'
import { TreeNodeAction, TreeNodeType } from '~/types/tree'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { importFormSchema } from '~/validation/import'
import { InputUpload } from '~/components/InputUpload'
import { Badge } from '~/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"

type Props = {
  organizationId: string,
  entity: TreeNodeType,
  action: TreeNodeAction,
  onClose: () => void
}

export const ImportModal = ({ entity, organizationId, action, onClose }: Props) => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>,
    result?: Record<string, string>,
  }>()
  const resolver = zodResolver(importFormSchema)
  const form = useForm<z.infer<typeof importFormSchema>>({
    resolver,
    defaultValues: {
      path: `${entity.slug}import/`,
      file: undefined,
    },
  })

  const onSubmit = (data: z.infer<typeof importFormSchema>) => {
    const formData = new FormData()
    formData.set('path', data.path)
    formData.set('file', data.file)
    fetcher.submit(
      formData,
      {
        action: `/organizations/${organizationId}/script/import`,
        method: 'POST',
        encType: 'multipart/form-data',
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

  return (
    <Dialog open={action === 'import'} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {!fetcher.data?.result && (
          <Form {...form}>
            <fetcher.Form
              className="flex flex-col gap-2 px-1"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <DialogHeader>
                <DialogTitle>Import Trigger and Shared from file</DialogTitle>
                <DialogDescription>
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target path</FormLabel>
                    <FormControl>
                      <Input placeholder="/import/" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <InputUpload
                        {...field}
                        accept={{
                          'application/json': ['.json'],
                        }}
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
                  Import
                  <Icons.loader
                    className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
                  />
                </Button>
              </DialogFooter>
            </fetcher.Form>
          </Form>
        )}
        {fetcher.data?.result && (
          <>
            <DialogHeader>
              <DialogTitle>Import Trigger and Shared from file</DialogTitle>
              <DialogDescription>
                Result
              </DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2">
              {Object.entries(fetcher.data?.result).map(([name, result]) => (
                <li key={name} className="flex gap-2 justify-between ">
                  <div>{name}</div>
                  {result === 'OK' ? (
                      <Badge variant="success">OK</Badge>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="destructive">KO</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{result}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button type="submit" className="flex gap-2" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}