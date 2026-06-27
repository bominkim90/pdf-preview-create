import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const headerIconBtnClass =
  'border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white';

export const headerPrimaryBtnClass =
  'border-0 bg-white text-[#1a3a6b] hover:bg-white/90 hover:text-[#1a3a6b]';

export const headerDangerBtnClass =
  'border-red-300/40 bg-white/10 text-red-100 hover:bg-red-500/30 hover:text-white';

export default function HeaderIconButton({
  label,
  onClick,
  disabled,
  destructive,
  primary,
  children,
  className,
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className={cn(
              primary ? headerPrimaryBtnClass : destructive ? headerDangerBtnClass : headerIconBtnClass,
              className
            )}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
