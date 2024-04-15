import * as React from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Icons } from '~/components/icons';
import { cn } from '~/utils/cn';
import { UsersResponse } from '~/types/pocketbase';

type Props = {
  user: UsersResponse
}

export const FormUsername = ({ user }: Props) => {
  const navigation = useNavigation();
  const action = useActionData<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  return (
    <Form
      method="POST"
      action="/profile"
      className="flex flex-col gap-2 px-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>Other users will be able to find you with this name.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="name">
              Name
            </Label>
            <Input id="name" name="name" defaultValue={user.name} />
            {
              action?.errors?.name && (
                <p className={cn('text-sm font-medium text-destructive')}>
                  {action?.errors?.name?.message}
                </p>
              )
            }
          </div>
          {action?.errors?.global && (
            <p className={cn('text-sm font-medium text-destructive')}>
              {action?.errors?.global?.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <input type="hidden" name="_action" value="username" />
          <Button type="submit" className="flex gap-2">
            Update
            <Icons.loader
              className={cn('animate-spin', { hidden: navigation.state === 'idle' })}
            />
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
};