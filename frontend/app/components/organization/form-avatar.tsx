import { useFetcher } from 'react-router-dom';
import { useDropzone } from 'react-dropzone-esm';
import { FormEvent, useCallback, useEffect, useState } from 'react';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { cn } from '~/utils/cn';
import { OrganizationsResponse } from '~/types/pocketbase';
import { ImagePb } from '~/components/image-pb';
import { getAvatarUrl } from '~/utils/avatar'

type Props = {
  organization: OrganizationsResponse,
}

export const FormOrganizationAvatar = ({ organization }: Props) => {
  const fetcher = useFetcher();
  const fetcherDelete = useFetcher();
  const [file, setFile] = useState<File & { preview: string }>();

  useEffect(() => {
    if (file) {
      // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
      return () => URL.revokeObjectURL(file.preview);
    }
  }, [file]);

  const handleOnDrop = useCallback((files: File[]) => {
    setFile(
      Object.assign(files[0], {
        preview: URL.createObjectURL(files[0])
      })
    );
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop: handleOnDrop
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData();
    formData.set('_action', 'avatar');
    if (file) {
      formData.set('avatar', file);
    }
    fetcher.submit(
      formData,
      { method: 'post', action: `/organizations/${organization.id}`, encType: 'multipart/form-data' }
    );
    setFile(undefined);
  };

  const handleDeleteSubmit = (e: FormEvent<HTMLFormElement>) => {
    fetcherDelete.submit(e.currentTarget);
    setFile(undefined);
  };

  return (
    <div
      className="flex flex-col gap-2 px-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          {
            !file && (
              <ImagePb
                url={getAvatarUrl(organization)}
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
              <input {...getInputProps()} />
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
          <fetcherDelete.Form
            className="flex flex-col gap-2 px-1"
            method="DELETE"
            action={`/organizations/${organization.id}`}
            onSubmit={handleDeleteSubmit}
          >
            <Button
              type="submit"
              className="flex gap-2"
              variant="destructive"
              disabled={organization.avatar === ''}
              name="_action" value="avatar"
            >
              Reset
              <Icons.loader
                className={cn('animate-spin', { hidden: fetcherDelete.state === 'idle' })}
              />
            </Button>
          </fetcherDelete.Form>
          <fetcher.Form
            className="flex flex-col gap-2 px-1"
            onSubmit={handleSubmit}
          >
            <Button
              type="submit"
              className="flex gap-2"
              disabled={!file}
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
  );
};