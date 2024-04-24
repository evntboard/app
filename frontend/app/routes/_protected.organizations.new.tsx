import { Form, Link, useActionData, useNavigation } from '@remix-run/react';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { cn } from '~/utils/cn';
import { Button, buttonVariants } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { createSession, getPocketbase, getUser } from '~/utils/pb.server';
import { Collections } from '~/types/pocketbase';
import { ClientResponseError } from 'pocketbase';

export const action = async (args: ActionFunctionArgs) => {
  const pb = getPocketbase(args.request);
  const user = getUser(pb);

  if (!user) {
    return createSession('/login', pb);
  }

  const formData = await args.request.formData();

  try {
    const newOrganization = await pb.collection(Collections.Organizations).create({
      'name': formData.get('name'),
      'user': pb.authStore.model?.id // current user connected
    });
    return redirect(`/organizations/${newOrganization.id}`);
  } catch (e) {
    if (e instanceof ClientResponseError) {
      return json({
        errors: {
          ...e.data.data,
          global: {
            message: e.data.message
          }
        }
      });
    }
  }
  return json({
    errors: {
      global: {
        message: 'Unknown error ...'
      }
    }
  });
};

export default function Index() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <div className="flex grow flex-col">
      <div className="flex items-center justify-end gap-2">
        <Link
          to={`/organizations`}
          className={cn(
            buttonVariants({ variant: 'ghost' })
          )}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </div>
      <Form
        method="POST"
        action="/organizations/new"
        className="flex flex-col gap-2 px-1"
      >
        <div className="flex flex-col gap-2">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className={cn(data?.errors?.name && 'text-destructive')}
            >
              Name
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              defaultValue=""
            />
            <p className={cn('text-sm font-medium text-destructive')}>
              {data?.errors?.name && (<span>{data?.errors?.name.message}</span>)}
            </p>
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" className={cn(buttonVariants())}>
              Create{' '}
              <Icons.loader
                className={cn('animate-spin', { hidden: navigation.state === 'idle' })}
              />
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );

}
