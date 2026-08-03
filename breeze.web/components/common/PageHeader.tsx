import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader = ({ icon: Icon, title, subtitle, className, children }: PageHeaderProps) => {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
};
