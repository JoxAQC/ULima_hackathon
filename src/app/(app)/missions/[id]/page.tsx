
'use client';
import { useParams, useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { missions } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Volume2, CheckCircle, Sparkles, Leaf } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { useToast } from "@/hooks/use-toast"

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const missionId = parseInt(params.id as string, 10);
  const mission = missions.find((m) => m.id === missionId);
  const { user, updateProgress } = useUser();

  if (!mission || !user) {
    return (
      <div className="p-4 text-center">
        <p>Misión no encontrada.</p>
      </div>
    );
  }

  const isCompleted = user.progress.missionsCompleted.includes(mission.id);

  const playAudio = async () => {
    try {
      await Tone.start();
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease("C4", "8n");
      toast({
        title: "Audio Reproduciéndose",
        description: "Este es un placeholder para la descripción de audio.",
      });
    } catch (e) {
      console.error("La reproducción de audio falló", e);
      toast({
        variant: "destructive",
        title: "Error de Audio",
        description: "No se pudo reproducir el audio. Asegúrate que tu navegador lo soporte.",
      });
    }
  };
  
  const handleCompleteMission = () => {
    if (!isCompleted) {
      updateProgress(mission.id, mission.exp, mission.credits, mission.financialSavings, mission.co2Saved);
      
      let toastDescription = `¡Has ganado ${mission.exp} EXP y ${mission.credits} créditos!`;

      if (user.segment === 'Adult') {
        toastDescription = `¡Felicidades! Has ahorrado S/ ${mission.financialSavings.toFixed(2)} y evitado ${mission.co2Saved}kg de CO2.`;
      } else {
        const trees = Math.floor(mission.co2Saved / 20) || 1; // Equivalencia simple
        toastDescription = `¡Genial! Tu proyecto evitó ${mission.co2Saved}kg de CO2, ¡equivale a plantar ${trees} ${trees > 1 ? 'árboles' : 'árbol'}!`;
      }

      toast({
        title: "¡Misión Completada!",
        description: toastDescription,
      });

      router.push('/missions');
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{mission.title}</CardTitle>
          <CardDescription className="text-base">{mission.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>{mission.exp} EXP</span>
            </div>
             <div className="flex items-center gap-1">
              <Leaf className="h-5 w-5 text-green-500" />
              <span>Ahorra {mission.co2Saved}kg CO₂</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{mission.credits} Créditos</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2">Pasos:</h3>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {mission.steps.map((step, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{`Paso ${index + 1}: ${step.title}`}</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p>{step.description}</p>
                  <Button variant="outline" size="sm" onClick={playAudio} className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Reproducir Audio
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCompleteMission} disabled={isCompleted}>
            {isCompleted ? <><CheckCircle className="mr-2 h-4 w-4" /> Misión Completada</> : 'Completar Misión'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
