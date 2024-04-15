import { useEffect, useState, MouseEvent } from 'react'
import { useFetcher } from '@remix-run/react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { ModulesResponse } from '~/types/pocketbase'
import { cn } from '~/utils/cn'

type Props = {
  module: ModulesResponse,
}

export const EjectModule = ({ module }: Props) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()

  const handleOpenDialog = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setOpenDialog(true)
  }

  const handleOnSave = async () => {
    fetcher.submit(
      {
        _action: 'eject',
      },
      {
        action: `/organizations/${module.organization}/modules/${module.id}`,
        method: 'POST',
        encType: 'application/json',
      },
    )
  }

  const handleOnReset = () => {
    setOpenDialog(false)
  }

  useEffect(() => {
    if (fetcher.state === 'loading' && !fetcher.data?.errors) {
      setOpenDialog(false)
    }
  }, [fetcher.state, fetcher.data])

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="icon" onClick={handleOpenDialog} variant="destructive">
          <Icons.disconnect className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Do you want to eject {module?.name} module ?</DialogTitle>
          <DialogDescription className="text-sm font-medium text-destructive">
            {fetcher.data?.errors?.global && (
              <>
                {fetcher.data?.errors?.global?.message}
              </>
            )}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={handleOnReset} variant="secondary">Cancel</Button>
            <Button type="button" onClick={handleOnSave} variant="destructive" className="flex gap-2">
              Eject
              <Icons.loader
                className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
              />
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}