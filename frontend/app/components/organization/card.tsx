import { Link } from 'react-router-dom';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { buttonVariants } from '~/components/ui/button';
import { AvatarPb } from '~/components/avatar-pb';
import { cn } from '~/utils/cn';
import { OrganizationsResponse, UserOrganizationResponse, UsersResponse } from '~/types/pocketbase';
import { getAvatarUrl } from '~/utils/avatar'

type Props = {
  organization: OrganizationsResponse<{
    user_organization_via_organization: UserOrganizationResponse<{ user: UsersResponse }>[]
  }>,
}

export const OrganizationCard = ({ organization }: Props) => {
  return (
    <Card key={organization.id} className="w-full">
      <CardHeader>
        <CardTitle className='flex gap-2 items-center'>
          <AvatarPb
            url={getAvatarUrl(organization)}
          />
          <span className="text-ellipsis overflow-hidden">
            {organization.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {organization.expand?.user_organization_via_organization[0].expand?.user?.name ?? '-'}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link
          to={`/organizations/${organization.id}`}
          className={cn(
            buttonVariants({ variant: 'default' })
          )}
        >
          Select
        </Link>
      </CardFooter>
    </Card>
  );
};