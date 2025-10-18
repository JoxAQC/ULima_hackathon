'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useGameProgress } from '@/hooks/use-game-progress';
// import { personalizedGuidance } from '@/ai/flows/personalized-guidance';
import { WayraIcon } from '../icons/hiri-icons';

const GuidanceTool = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guidance, setGuidance] = useState('');
  const { progress } = useGameProgress();

  const getHint = () => {
    setIsLoading(true);
    setGuidance('');
    
    // Simula la llamada a la API y la respuesta de la IA
    setTimeout(() => {
        // const playerProgress = `El jugador tiene un puntaje de ${progress.score}, ha completado las misiones: ${progress.completedMissions.join(', ') || 'ninguna'}. Ha desbloqueado estas cartas de conocimiento: ${progress.unlockedCards.join(', ') || 'ninguna'}.`;
        const placeholderGuidance = "Veo que has comenzado tu viaje. Intenta construir una Lámpara Solar para llevar luz a tu aldea y ganar tu primera insignia. ¡Cada pequeño paso hace una gran diferencia!";
        setGuidance(placeholderGuidance);
        setIsLoading(false);
    }, 1000);
  };

  const handleOpen = () => {
    setIsOpen(true);
    getHint();
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setGuidance('');
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Obtener una Pista"
        >
          <WayraIcon className="w-6 h-6" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
                <WayraIcon className="w-5 h-5 text-primary"/>
                Guía Personalizada
            </DialogTitle>
            <DialogDescription>
              Wayra, el espíritu del viento, tiene algo de sabiduría para ti.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 min-h-[100px] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <p className="text-sm text-foreground">{guidance}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>¡Entendido, gracias!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GuidanceTool;
