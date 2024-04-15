import { cn } from '~/utils/cn';

type Props = {
  url?: string,
  className?: string
}
export const ImagePb = ({ url, className }: Props) => {

  if (url === '' || url === undefined) {
    return (
      <div className={cn(className, 'flex items-center justify-center')}>
        <span className="text-muted">-</span>
      </div>
    );
  }
  return (
    <img src={url} className={className} alt="img" />
  );
};