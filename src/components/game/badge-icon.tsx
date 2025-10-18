'use client';

import type { Badge } from '@/lib/game-data';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BadgeIconProps {
  badge: Badge;
  isUnlocked: boolean;
}

export function BadgeIcon({ badge, isUnlocked }: BadgeIconProps) {
  const Icon = badge.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300',
              isUnlocked ? 'bg-secondary/20 border-secondary' : 'bg-muted/20 border-muted'
            )}
          >
            <Icon
              className={cn(
                'w-12 h-12 transition-colors duration-300',
                isUnlocked ? 'text-secondary' : 'text-muted-foreground'
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-center">
          <p className="font-bold font-headline">{badge.name}</p>
          <p className="text-xs text-muted-foreground">{isUnlocked ? badge.description : 'Bloqueado'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
