import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog';
import { OrganizationsResponse } from '~/types/pocketbase';
import { AvatarPb } from '~/components/avatar-pb';

type Props = {
  organization: OrganizationsResponse,
  organizationAvatarUrl?: string,
}

export const AddMember = ({ organizationAvatarUrl, organization }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add member to
            <AvatarPb url={organizationAvatarUrl}/>
            {organization.name}
          </DialogTitle>
        </DialogHeader>
        // TODO
      </DialogContent>
    </Dialog>
  );
};