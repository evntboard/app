import { useDropzone } from 'react-dropzone-esm'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Form, useFetcher, useNavigation } from '@remix-run/react'

import { Button } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ImagePb } from '~/components/image-pb'
import { UsersResponse } from '~/types/pocketbase'
import { cn } from '~/utils/cn'
import { getAvatarUrl } from '~/utils/avatar'
import { useRootContext } from '~/context/root.tsx';

type Props = {
  user: UsersResponse
}

export const FormAvatar = ({ user }: Props) => {
  const rootContext = useRootContext()
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>()
  const [file, setFile] = useState<File & { preview: string }>()
  const navigation = useNavigation()

  useEffect(() => {
    if (file) {
      // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
      return () => URL.revokeObjectURL(file.preview)
    }
  }, [file])

  const handleOnDrop = useCallback((files: File[]) => {
    setFile(
      Object.assign(files[0], {
        preview: URL.createObjectURL(files[0]),
      }),
    )
  }, [setFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: handleOnDrop,
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const formData = new FormData()
    formData.set('_action', 'avatar')
    if (file) {
      formData.set('avatar', file)
    }
    fetcher.submit(
      formData,
      {
        method: 'post',
        encType: 'multipart/form-data',
      },
    )
    setFile(undefined)
  }

  return (
    <div className="flex flex-col gap-2 px-1">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          {
            !file && (
              <ImagePb
                url={getAvatarUrl(rootContext.API_URL, user)}
                className="w-28 min-h-28 bg-foreground border rounded aspect-square h-full object-cover"
              />
            )
          }
          {
            file && (
              <img
                src={file.preview}
                className="w-28 min-h-28 bg-foreground border rounded aspect-square h-full object-cover"
                alt="New user avatar"
              />
            )
          }
          <div className="space-y-2 grow">
            <div {...getRootProps()}>
              <input {...getInputProps()} name="avatar" />
              {
                isDragActive ?
                  <p>Drop the files here ...</p> :
                  <p>Drag 'n' drop some files here, or click to select files</p>
              }
            </div>
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.avatar && (
                <span>{fetcher.data?.errors?.avatar.message}</span>)}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Form
            className="flex flex-col gap-2 px-1"
            method="DELETE"
          >
            <Button
              type="submit"
              className="flex gap-2"
              variant="destructive"
              disabled={user.avatar === ''}
              name="_action" value="avatar"
            >
              Reset
              <Icons.loader
                className={cn('animate-spin', { hidden: navigation.state !== 'submitting' })}
              />
            </Button>
          </Form>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={handleSubmit}
          >
            <Button
              type="submit"
              className="flex gap-2"
              disabled={!file}
              name="_action" value="avatar"
            >
              Update
              <Icons.loader
                className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
              />
            </Button>
          </fetcher.Form>
        </CardFooter>
      </Card>
    </div>
  )
}