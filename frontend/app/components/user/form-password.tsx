import { useFetcher } from 'react-router-dom';
import * as React from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { cn } from '~/utils/cn';
import { Label } from '~/components/ui/label';

export const FormPassword = () => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  return (
    <fetcher.Form
      method="POST"
      className="flex flex-col gap-2 px-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            If you have lost your password, use the forgot password link at login page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">
              Old password
            </Label>
            <Input id="oldPassword" name="oldPassword" type="password" defaultValue="" />
            {
              fetcher.data?.errors?.oldPassword && (
                <p className={cn('text-sm font-medium text-destructive')}>
                  {fetcher.data?.errors?.oldPassword.message}
                </p>
              )
            }
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>
            <Input id="password" name="password" type="password" defaultValue="" />
            {
              fetcher.data?.errors?.password && (
                <p className={cn('text-sm font-medium text-destructive')}>
                  {fetcher.data?.errors?.password.message}
                </p>
              )
            }
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">
              Confirm password
            </Label>
            <Input id="passwordConfirm" name="passwordConfirm" type="password" defaultValue="" />
            {
              fetcher.data?.errors?.passwordConfirm && (
                <p className={cn('text-sm font-medium text-destructive')}>
                  {fetcher.data?.errors?.passwordConfirm.message}
                </p>
              )
            }
          </div>
          {fetcher.data?.errors?.global && (
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.global?.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <input type="hidden" name="_action" value="password" />
          <Button type="submit" className="flex gap-2">
            Change password
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
            />
          </Button>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
};