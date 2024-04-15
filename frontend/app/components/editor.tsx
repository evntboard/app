import { ReactNode } from 'react'
import { Editor as MonacoEditor, EditorProps } from '@monaco-editor/react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { useTheme } from '~/components/theme-provider'

type Props = EditorProps & {
  noFullScreen?: boolean
  title?: string
  toolbar?: ReactNode
}

export function Editor({ toolbar, title, noFullScreen = false, ...props }: Props) {
  const { theme } = useTheme()

  return (
    <div className="flex flex-1 flex-col gap-2 grow">
      <div className="flex gap-2">
        {
          !noFullScreen && (
            <Dialog>
              <DialogTrigger asChild>
                <div>
                  <Button type="button" size="sm" variant="outline">
                    <Icons.zoom className="mr-2  h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="h-full w-full max-w-full max-h-full">
                <DialogHeader>
                  <DialogTitle>{title ?? 'Editor'}</DialogTitle>
                  <DialogDescription />
                  <MonacoEditor
                    {...props}
                    height="100%"
                    className="flex-1"
                    theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                  />
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )
        }
        {toolbar}
      </div>
      <MonacoEditor
        {...props}
        className="flex-1"
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
      />
    </div>
  )
}