'use client';
import { Info } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Small info icon with a hover/focus tooltip — for explaining what a field
 * means without cluttering the label.
 */
export function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={text}
            className="text-muted-foreground/70 hover:text-muted-foreground inline-flex cursor-help"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-wrap">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default InfoTip;
