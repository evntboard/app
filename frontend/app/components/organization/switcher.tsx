import * as React from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {Button} from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '~/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/ui/popover';
import {Icons} from '~/components/icons';
import {AvatarPb} from '~/components/avatar-pb';
import {cn} from '~/utils/cn';
import { OrganizationsResponse } from '~/types/pocketbase';
import { useLocation } from '@remix-run/react';
import { getAvatarUrl } from '~/utils/avatar'

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface Props extends PopoverTriggerProps {
  className?: string,
  organizations: OrganizationsResponse[],
}

export function OrganizationSwitcher({className, organizations}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const {organizationId} = useParams();
  const [open, setOpen] = React.useState(false);
  const currentOrga = organizations?.find(v => v.id === organizationId) ?? undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className={cn('w-[200px] justify-between', className)}
        >
          {
            currentOrga && (
              <div className="flex items-center gap-2 w-full">
                <AvatarPb
                  url={getAvatarUrl(currentOrga)}
                />
                <div className="grow text-ellipsis overflow-hidden text-left">
                  {
                    currentOrga?.name ?? '-'
                  }
                </div>
              </div>
            )
          }
          {
            !currentOrga && (
              <p className="text-muted">
                Select organization ...
              </p>
            )
          }
          <Icons.ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organization..."/>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations?.map((team) => (
                <CommandItem
                  key={team.id}
                  onSelect={() => {
                    const oldUrl = location.pathname.split('/')
                    if (oldUrl[3]) {
                      navigate(`/organizations/${team.id}/${oldUrl[3]}`);
                    } else {
                      navigate(`/organizations/${team.id}`);
                    }
                    setOpen(false);
                  }}
                  className="flex gap-2 w-full cursor-pointer"
                >
                  <AvatarPb
                    url={getAvatarUrl(team)}
                  />
                  <div className="grow text-ellipsis overflow-hidden">
                    {team?.name ?? '-'}
                  </div>
                  <Icons.Check
                    className={cn(
                      'h-4 w-4',
                      organizationId === team?.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator/>
          <CommandList>
            <CommandGroup>
              <CommandItem
                className="flex gap-2 cursor-pointer"
                onSelect={() => {
                  setOpen(false);
                  navigate('/organizations/new');
                }}
              >
                <Icons.Building className="h-4 w-4"/>
                Create organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}