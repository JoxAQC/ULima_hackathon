
'use client';

import { useState } from 'react';
import type { Mission } from '@/lib/game-data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameProgress } from '@/hooks/use-game-progress';
import Image from 'next/image';
import { CheckCircle2, FileText, HelpCircle, Upload, Video, Hammer } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '../ui/separator';

type MissionStep = 'quiz' | 'instructions' | 'tutorial' | 'upload' | 'completed';

const STEPS_ORDER: MissionStep[] = ['quiz', 'instructions', 'tutorial', 'upload'];

export function GameMissionCard({ mission }: { mission: Mission }) {
  const { progress, completeMission } = useGameProgress();
  const isCompleted = progress.completedMissions.includes(mission.id);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<MissionStep>(isCompleted ? 'completed' : 'quiz');

  const handleOpen = () => {
    setCurrentStep(isCompleted ? 'completed' : 'quiz');
    setIsOpen(true);
  };
  
  const handleClose = () => setIsOpen(false);

  const handleNextStep = () => {
    const currentIndex = STEPS_ORDER.indexOf(currentStep as MissionStep);
    if (currentIndex < STEPS_ORDER.length - 1) {
      setCurrentStep(STEPS_ORDER[currentIndex + 1]);
    } else {
      // The mission completion is now handled inside the 'buy' flow on the main page.
      // This button just closes the modal.
      setCurrentStep('completed');
    }
  };
  
  const handleComplete = () => {
      completeMission(mission.id);
      setCurrentStep('completed');
  }

  const StepContent = () => {
    switch (currentStep) {
      case 'quiz':
        return (
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary"/>¡Prueba Rápida!</h3>
            <p className="mb-4 text-muted-foreground">{mission.quiz.question}</p>
            <div className="flex flex-col gap-2">
              {mission.quiz.options.map((option, index) => (
                <Button key={index} variant="outline" className="justify-start">
                  {option}
                </Button>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleNextStep}>Enviar Respuesta</Button>
            </DialogFooter>
          </div>
        );
      case 'instructions':
        return (
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/>Guía de Construcción</h3>
            
            <div className='mb-4'>
                <h4 className='font-bold text-md mb-2 flex items-center gap-2'><Hammer className='w-4 h-4 text-primary' />Materiales Necesarios:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {mission.materials.map((material, index) => (
                        <li key={index}>{material}</li>
                    ))}
                </ul>
            </div>
            
            <Separator className='my-4' />

            <p className="mb-2 text-muted-foreground">Sigue estos pasos para construir tu {mission.title}:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {mission.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <DialogFooter className="mt-4">
              <Button onClick={handleNextStep}>Listo para el Tutorial</Button>
            </DialogFooter>
          </div>
        );
      case 'tutorial':
        return (
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Video className="w-5 h-5 text-primary"/>Video Tutorial</h3>
            <p className="mb-4 text-muted-foreground">Mira este video para ver cómo se hace.</p>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Espacio para el reproductor de video</p>
            </div>
             <DialogFooter className="mt-4">
              <Button onClick={handleNextStep}>¡Ya lo Construí!</Button>
            </DialogFooter>
          </div>
        );
      case 'upload':
        return (
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Upload className="w-5 h-5 text-primary"/>Envía tu Trabajo</h3>
            <p className="mb-4 text-muted-foreground">¡Muestra tu creación para completar la misión!</p>
            <div className="h-40 border-2 border-dashed border-muted-foreground rounded-lg flex flex-col items-center justify-center text-center p-4">
              <p>Espacio para subir archivos.</p>
              <p className="text-xs text-muted-foreground">Haz clic o arrastra y suelta</p>
            </div>
             <DialogFooter className="mt-4">
              <Button onClick={handleComplete}>Completar Misión</Button>
            </DialogFooter>
          </div>
        );
        case 'completed':
          return (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl">¡Misión Completa!</h3>
              <p className="text-muted-foreground">¡Has ganado nuevos conocimientos y ayudado a tu aldea!</p>
              <DialogFooter className="mt-6">
                <Button onClick={handleClose}>¡Genial!</Button>
              </DialogFooter>
            </div>
          );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
        <div className="relative aspect-video">
          <Image
            src={mission.image.imageUrl}
            alt={mission.title}
            fill
            className="object-cover"
            data-ai-hint={mission.image.imageHint}
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="font-bold">+{mission.points} Energía</Badge>
          </div>
        </div>
        <CardHeader className="flex-grow">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <mission.icon className="w-5 h-5 text-primary" />
            {mission.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">{mission.description}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleOpen} className="w-full" disabled={isCompleted}>
            {isCompleted ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completado
              </>
            ) : (
              'Ver Misión'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{mission.title}</DialogTitle>
            <DialogDescription>
              Completa los pasos para ganar tu recompensa.
            </DialogDescription>
          </DialogHeader>
          <Separator/>
          <div className="py-4">
            <StepContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
