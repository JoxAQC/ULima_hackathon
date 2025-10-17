'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { missions } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SmartAssistant } from '@/components/missions/smart-assistant';

export default function MissionsPage() {
  const { user } = useUser();
  if (!user) return null;

  const availableMissions = missions.filter(
    (mission) => mission.userSegment === 'All' || mission.userSegment === user.segment
  );
  
  const modules = availableMissions.reduce((acc, mission) => {
    const moduleTitle = `Módulo ${mission.module}: ${mission.category}`;
    if (!acc[moduleTitle]) {
      acc[moduleTitle] = [];
    }
    acc[moduleTitle].push(mission);
    return acc;
  }, {} as Record<string, typeof availableMissions>);

  const getModuleImage = (category: string) => {
    if (category.includes('Iluminación')) {
      return PlaceHolderImages.find(img => img.id === 'mission-iluminacion');
    }
    if (category.includes('Climatización')) {
      return PlaceHolderImages.find(img => img.id === 'mission-climatizacion');
    }
    if (category.includes('Micro-Generación')) {
      return PlaceHolderImages.find(img => img.id === 'mission-micro-generacion');
    }
    return undefined;
  }

  return (
    <div className="p-4 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Misiones de Energía</h1>
        <p className="text-muted-foreground">¡Completa misiones para construir un futuro más sostenible y ganar recompensas!</p>
      </header>
      
      <SmartAssistant allMissions={availableMissions} />

      <div className="space-y-8">
        {Object.entries(modules).map(([moduleTitle, missionsInModule]) => {
          const moduleImage = getModuleImage(moduleTitle);
          return (
            <section key={moduleTitle}>
              <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                {moduleImage && (
                  <Image 
                    src={moduleImage.imageUrl} 
                    alt={moduleImage.description} 
                    layout="fill" 
                    objectFit="cover" 
                    className="brightness-75"
                    data-ai-hint={moduleImage.imageHint}
                  />
                )}
                <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-2xl font-bold text-white">{moduleTitle}</h2>
                </div>
              </div>

              <div className="space-y-4">
                {missionsInModule.map((mission) => {
                  const isCompleted = user.progress.missionsCompleted.includes(mission.id);
                  return (
                    <Link href={`/missions/${mission.id}`} key={mission.id}>
                      <Card className={`hover:border-primary transition-all ${isCompleted ? 'bg-muted/50' : 'bg-card'}`}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                          <div>
                            <CardTitle className="mb-1 text-lg">{mission.title}</CardTitle>
                            <CardDescription>{mission.description}</CardDescription>
                          </div>
                          {isCompleted ? (
                            <Badge variant="outline">Completado</Badge>
                          ) : (
                            <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-1" />
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              <span>{mission.exp} EXP</span>
                              <span className="text-lg">·</span>
                              <span>{mission.credits} Créditos</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  );
}
