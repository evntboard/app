import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Link, useFetcher, useLoaderData, useRevalidator } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { ClientResponseError } from 'pocketbase';
import { useEffect, useState } from 'react';

import { cn } from '~/utils/cn';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections, StoragesResponse } from '~/types/pocketbase';
import { storageCreateFormSchema } from '~/validation/storage';
import { DataTable } from '~/components/data-table';
import { Button, buttonVariants } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu';
import { ScrollArea } from '~/components/ui/scroll-area';
import { pb } from '~/utils/pb.client';

export async function action(args: ActionFunctionArgs) {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const organizationId = args.params?.organizationId;

  if (!organizationId) {
    throw new Error('404');
  }

  let formValues: { _action?: string } = {};

  if (args.request.headers.get('content-type') === 'application/json') {
    formValues = await args.request.json();
  } else {
    const formData = await args.request.formData();
    formValues = Object.fromEntries(formData.entries());
  }

  switch (formValues?._action) {
    case 'create': {
      const result = storageCreateFormSchema.safeParse(formValues);
      if (!result.success) {
        const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
          return {
            ...acc,
            [currentValue.path.join('.')]: {
              type: currentValue.code,
              message: currentValue.message
            }
          };
        }, {});
        return json({ errors: errorsFormatted });
      }
      try {
        const created = await pb.collection(Collections.Storages).create({
          'organization': organizationId,
          'key': result.data.key,
          'value': null
        });
        return redirect(`/organizations/${organizationId}/storages/${created.id}`);
      } catch (e) {
        if (e instanceof ClientResponseError) {
          return {
            errors: {
              ...e.data.data,
              global: {
                message: e.data.message
              }
            }
          };
        }
      }
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...'
      }
    }
  });
}

export async function loader(args: ActionFunctionArgs) {
  const organizationId = args.params?.organizationId;

  if (!organizationId) {
    throw new Error('404');
  }

  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const storages = await pb
    .collection(Collections.Storages)
    .getFullList(
      {
        filter: `organization.id = "${organizationId}"`,
        sort: '+created'
      }
    );

  const organization = await pb
    .collection(Collections.Organizations)
    .getOne(organizationId);

  return json({
    organization,
    storages
  });
}

export const columns: ColumnDef<StoragesResponse>[] = [
  {
    accessorKey: 'key',
    header: 'Key'
  },
  {
    accessorKey: 'value',
    header: 'Value'
  },
  {
    id: 'actions',
    cell: function ActionComponent({ row }) {
      const fetcher = useFetcher();
      const [modalDeleteOpen, setModalDeleteOpen] = useState(false);

      useEffect(() => {
        if (fetcher.state === 'loading') {
          setModalDeleteOpen(false)
        }
      }, [fetcher.state]);

      const handleOpenDelete = () => {
        setModalDeleteOpen(true);
      };

      return (
        <>
          <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Do you want to delete {row.original.key} storage ?</DialogTitle>
                <DialogDescription />
                <DialogFooter>
                  <fetcher.Form
                    method="POST"
                    action={`/organizations/${row.original.organization}/storages/${row.original.id}`}
                  >
                    <Button variant="destructive" type="submit" name="_action" value="delete">Delete</Button>
                  </fetcher.Form>
                </DialogFooter>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Icons.more className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  to={`/organizations/${row.original.organization}/storages/${row.original.id}`}
                  className="flex gap-2 cursor-pointer"
                >
                  <Icons.edit className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={handleOpenDelete}>
                <Icons.delete className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }
  }
];

export default function OrganizationIdScriptLayout() {
  const { storages, organization } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  useEffect(() => {
    pb?.collection(Collections.Storages).subscribe(
      '*',
      (e) => {
        revalidator.revalidate();
      },
      {
        filter: `organization.id = "${organization.id}"`
      }
    );

    return () => {
      pb?.collection(Collections.Storages).unsubscribe('*')
    }
  }, [organization.id, revalidator]);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex justify-between">
        <h1 className="font-heading text-xl">
          Storages
        </h1>
        <Link
          to={`/organizations/${organization.id}/storages/new`}
          className={cn(
            'flex gap-2',
            buttonVariants({ variant: 'default' })
          )}
        >
          <Icons.create className="h-4 w-4" />
          New
        </Link>
      </div>
      <ScrollArea className="py-4 grow">
        <DataTable columns={columns} data={storages as StoragesResponse[]} />
      </ScrollArea>
    </div>
  );
}


