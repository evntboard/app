import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Icons } from '~/components/icons';
import { cn } from '~/utils/cn';

type Props = {
  url?: string,
  className?: string
}
export const AvatarPb = ({ url, className }: Props) => {

  return (
    <Avatar className={cn('h-6 w-6', className)}>
      <AvatarImage src={url} className="object-cover bg-foreground" />
      <AvatarFallback>
        <Icons.user className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
};