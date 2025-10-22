
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import * as Tone from 'tone';
import { missions } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Volume2, CheckCircle, Sparkles, Leaf, Award } from 'lucide-react';
import MaterialsValidator from '@/components/missions/materials-validator';
import { useUser } from '@/context/user-context';
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const missionId = parseInt(params.id as string, 10);
  const mission = missions.find((m) => m.id === missionId);
  const { user, updateProgress } = useUser();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [showValidator, setShowValidator] = useState(false);
  const [validationHtml, setValidationHtml] = useState('');
  const [validationOk, setValidationOk] = useState(false);


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
  
  const missionsRequiringValidation = new Set([1,3,5]);

  const handleCompleteMission = () => {
    if (isCompleted) return;
    const needsValidation = missionsRequiringValidation.has(mission.id);
    if (needsValidation && !validationOk) {
      // Requiere validación previa
      setShowValidator(true);
      return;
    }
    // Sin validación requerida o ya validado
    finalizeCompletion();
  };

  function finalizeCompletion() {
    updateProgress(mission!.id, mission!.exp, mission!.credits, mission!.financialSavings, mission!.co2Saved);
    let rewardMessage = `¡Has ganado ${mission!.exp} EXP y ${mission!.credits} créditos!`;
    if (user!.segment === 'Adult') {
      rewardMessage = `¡Felicidades! Has ahorrado S/ ${mission!.financialSavings.toFixed(2)} y evitado ${mission!.co2Saved}kg de CO2.`;
    } else {
      const trees = Math.floor(mission!.co2Saved / 20) || 1; 
      rewardMessage = `¡Genial! Tu proyecto evitó ${mission!.co2Saved}kg de CO2, ¡equivale a plantar ${trees} ${trees > 1 ? 'árboles' : 'árbol'}!`;
    }
    setCompletionMessage(rewardMessage);
    setShowCompletionDialog(true);
  }

  const closeDialog = () => {
    setShowCompletionDialog(false);
    router.push('/missions');
  }

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
        <CardFooter className="flex flex-col gap-4">
          {showValidator && (
            <div className="w-full border rounded p-3">
              <h4 className="font-semibold mb-2">Validación por fotos</h4>
              <MaterialsValidator
                missionId={mission.id}
                onCancel={()=> setShowValidator(false)}
                onValidated={(res)=>{
                  setValidationHtml(res.detailsHtml);
                  setValidationOk(res.ok);
                }}
              />
              {validationHtml && (
                <div className="prose prose-sm max-w-none mt-3" dangerouslySetInnerHTML={{ __html: validationHtml }} />
              )}
            </div>
          )}
          {missionsRequiringValidation.has(mission.id) && (
            <Button variant="outline" className="w-full" onClick={() => setShowValidator(true)} disabled={isCompleted}>
              Validar por fotos
            </Button>
          )}
          <Button
            className="w-full"
            onClick={handleCompleteMission}
            disabled={isCompleted || (missionsRequiringValidation.has(mission.id) && !validationOk)}
            title={missionsRequiringValidation.has(mission.id) && !validationOk ? 'Primero completa la validación' : undefined}
          >
            {isCompleted ? <><CheckCircle className="mr-2 h-4 w-4" /> Misión Completada</> : 'Completar Misión'}
          </Button>
        </CardFooter>
      </Card>
      
       <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center">
              <Award className="h-16 w-16 text-yellow-500 mb-4" />
              <AlertDialogTitle className="text-2xl">¡Misión Completada!</AlertDialogTitle>
              <AlertDialogDescription className="text-lg mt-2">
                {completionMessage}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeDialog} className="w-full">Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
