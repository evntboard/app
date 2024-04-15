import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { cn } from '~/utils/cn';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { useFetcher } from 'react-router-dom';
import { OrganizationsResponse } from '~/types/pocketbase';

type Props = {
  organization: OrganizationsResponse
}

export const FormOrganizationName = ({ organization }: Props) => {
  const fetcher = useFetcher();

  return (
    <fetcher.Form
      method="POST"
      action={`/organizations/${organization.id}`}
      className="flex flex-col gap-2 px-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>Other users will be able to find you with this name.</CardDescription>
        </CardHeader>
        <CardContent>
          <>
            <Input
              key={organization.id}
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              defaultValue={organization.name}
            />
            <p className={cn('text-sm font-medium text-destructive')}>
              {fetcher.data?.errors?.name && (<span>{fetcher.data?.errors?.name.message}</span>)}
            </p>
          </>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" className="flex gap-2" name="_action" value="name">
            Update
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
            />
          </Button>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
};