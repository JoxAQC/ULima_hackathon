
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { missions } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { ArrowRight, Sparkles, BookOpen, Zap } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SmartAssistant } from '@/components/missions/smart-assistant';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
      <header className="text-center">
        <h1 className="text-3xl font-bold">Explora y Aprende</h1>
        <p className="text-muted-foreground">Desarrolla tus habilidades y construye un futuro sostenible.</p>
      </header>
      
      <Link href="/learn">
        <Card className="bg-secondary/20 hover:border-secondary transition-all">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-secondary/50 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="flex-grow">
                <CardTitle>Aprende con Energía</CardTitle>
                <CardDescription>Fortalece tus conocimientos con guías y tests interactivos.</CardDescription>
              </div>
              <ArrowRight className="h-5 w-5 text-secondary-foreground" />
            </div>
          </CardHeader>
        </Card>
      </Link>

      <Accordion type="single" collapsible className="w-full" defaultValue='actua'>
        <AccordionItem value="actua">
          <AccordionTrigger className="text-2xl font-bold flex items-center gap-2 w-full justify-center hover:no-underline">
            <Zap /> Actúa con Energía
          </AccordionTrigger>
          <AccordionContent className="pt-6 space-y-8">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
