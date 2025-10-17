'use client';
import { useParams, useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { missions } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Volume2, CheckCircle, Sparkles } from 'lucide-react';
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
        <p>Mission not found.</p>
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
        title: "Audio Playing",
        description: "This is a placeholder for the audio description.",
      });
    } catch (e) {
      console.error("Audio playback failed", e);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Could not play audio. Please ensure your browser supports it.",
      });
    }
  };
  
  const handleCompleteMission = () => {
    if (!isCompleted) {
      updateProgress(mission.id, mission.exp, mission.credits, mission.financialSavings);
      toast({
        title: "Mission Complete!",
        description: `You've earned ${mission.exp} EXP and ${mission.credits} credits.`,
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
              <span>{mission.credits} Credits</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2">Steps:</h3>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {mission.steps.map((step, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{`Step ${index + 1}: ${step.title}`}</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p>{step.description}</p>
                  <Button variant="outline" size="sm" onClick={playAudio} className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Play Audio
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCompleteMission} disabled={isCompleted}>
            {isCompleted ? <><CheckCircle className="mr-2 h-4 w-4" /> Mission Completed</> : 'Complete Mission'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
