'use client';

import type { KnowledgeCard } from '@/lib/game-data';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface KnowledgeCardProps {
  card: KnowledgeCard;
  isUnlocked: boolean;
}

export function GameKnowledgeCard({ card, isUnlocked }: KnowledgeCardProps) {
  return (
    <div className="group perspective-1000">
      <Card
        className={cn(
          'relative h-[400px] w-full transform-style-3d transition-transform duration-700',
          isUnlocked ? 'group-hover:rotate-y-180' : ''
        )}
      >
        {/* Front of the card */}
        <div className="absolute backface-hidden w-full h-full overflow-hidden rounded-lg">
          <Image
            src={card.image.imageUrl}
            alt={card.title}
            fill
            className={cn('object-cover transition-transform duration-500 group-hover:scale-110', !isUnlocked && 'grayscale blur-sm')}
            data-ai-hint={card.image.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <CardHeader className="absolute bottom-0 text-white">
            <CardTitle className="font-headline text-xl">{isUnlocked ? card.title : 'Bloqueada'}</CardTitle>
          </CardHeader>
        </div>

        {/* Back of the card */}
        {isUnlocked && (
           <div className="absolute rotate-y-180 backface-hidden w-full h-full bg-card rounded-lg overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center">
              <p className="text-muted-foreground text-center p-4">
                {card.fact}
              </p>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
