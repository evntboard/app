import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/utils/cn';
import { Button } from '~/components/ui/button';
import { Icons } from '~/components/icons';
import { useFetcher } from 'react-router-dom';
import { OrganizationsResponse } from '~/types/pocketbase';

type Props = {
  organization: OrganizationsResponse
}

export const FormOrganizationDelete = ({ organization }: Props) => {
  const fetcher = useFetcher<{
    errors?: Record<string, { type: string, message: string }>
  }>();

  return (
    <fetcher.Form
      method="POST"
      action={`/organizations/${organization.id}`}
      className="flex flex-col gap-2 px-1"
    >
      <Card>
        <CardHeader>
          <CardTitle>Delete</CardTitle>
          <CardDescription />
        </CardHeader>
        <CardContent>
          {fetcher.data?.errors?.global && (<span className="text-destructive">{fetcher.data?.errors?.global.message}</span>)}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" type="submit" className="flex gap-2" name="_action" value="delete">
            Delete
            <Icons.loader
              className={cn('animate-spin', { hidden: fetcher.state === 'idle' })}
            />
          </Button>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
};