'use client';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimeAgo } from '@/lib/utils';

export interface DataCardBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface DataCardProps {
  icon: React.ReactNode;
  iconVariant?: 'primary' | 'destructive' | 'muted';
  name: string;
  badges?: DataCardBadge[];
  summaryLines?: string[];
  updatedAt?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  children?: React.ReactNode;
}

const ICON_VARIANTS = {
  primary: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
} as const;

export function DataCard({
  icon,
  iconVariant = 'primary',
  name,
  badges = [],
  summaryLines = [],
  updatedAt,
  onEdit,
  onDelete,
  canDelete = false,
  children,
}: DataCardProps) {
  return (
    <div className="group hover:border-primary/30 rounded-lg border transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${ICON_VARIANTS[iconVariant]}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{name || 'Unnamed'}</span>
            {badges.map((badge, i) => (
              <Badge
                key={i}
                variant={badge.variant ?? 'secondary'}
                className="shrink-0 text-[10px]"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
          {summaryLines.length > 0 && (
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
              {summaryLines.map((line, i) => (
                <span key={i} className="text-muted-foreground">
                  {line}
                </span>
              ))}
            </div>
          )}
          {updatedAt && (
            <p className="text-muted-foreground mt-0.5 text-[10px]">
              Updated {formatTimeAgo(updatedAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="size-8 cursor-pointer" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && canDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="size-8 cursor-pointer"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
