'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { recommendMissions } from '@/ai/flows/recommend-missions-flow';
import type { Mission } from '@/lib/data';
import Link from 'next/link';

export function SmartAssistant({ allMissions }: { allMissions: Mission[] }) {
  const [materials, setMaterials] = useState('');
  const [recommendations, setRecommendations] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const result = await recommendMissions({ materials, allMissions });
      const recommendedMissions = allMissions.filter(m => result.recommendedMissionIds.includes(m.id));
      setRecommendations(recommendedMissions);
    } catch (e) {
      console.error(e);
      setError('No se pudieron obtener recomendaciones. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Asistente Inteligente</CardTitle>
            <CardDescription>¿No sabes por dónde empezar? ¡Te ayudo!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="materials" className="block text-sm font-medium text-foreground mb-2">
            ¿Qué materiales tienes en casa? (ej. botellas de plástico, cartón, focos viejos)
          </label>
          <Textarea
            id="materials"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="Escribe tus materiales aquí, separados por comas..."
            className="bg-background"
          />
        </div>
        <Button onClick={handleRecommendation} disabled={isLoading || !materials} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            'Recomiéndame una Misión'
          )}
        </Button>
        
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        
        {recommendations.length > 0 && (
          <div className="space-y-2 pt-4">
            <h4 className="font-semibold">¡Te recomiendo estas misiones!</h4>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.map(mission => (
                <li key={mission.id}>
                  <Link href={`/missions/${mission.id}`} className="text-primary underline hover:no-underline">
                    {mission.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
