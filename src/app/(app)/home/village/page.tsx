
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameProgress } from '@/hooks/use-game-progress';
import { missions } from '@/lib/game-data';
import Village from '@/components/game/village';
import GuidanceTool from '@/components/game/guidance-tool';
import { Zap, ShieldCheck } from 'lucide-react';
import type { FC } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className="bg-card/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
    <div className="p-2 rounded-md" style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-lg font-bold font-headline">{value}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { progress, completeMission, addScore, completeMissionPaid } = useGameProgress();
  const { toast } = useToast();
  const energy = progress.score;

  const handleBuy = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    if (progress.score < mission.points) {
      toast({
        title: '¡Energía Insuficiente!',
        description: `Necesitas ${mission.points - progress.score} más de energía para construir esto.`,
        variant: 'destructive',
      });
      return;
    }
    
    completeMission(missionId);

    toast({
      title: '¡Mejora Construida!',
      description: `Has construido ${mission.title} y tu aldea ha mejorado.`,
    });
  };

  return (
    <div className="container mx-auto m max-w-6xl px-4 py-4 space-y-6">
      {/* Estado de la Aldea */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Estado de la Aldea</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Zap className="text-background" />}
              label="Energía"
              value={energy}
              color="hsl(var(--primary))"
            />
            <StatCard
              icon={<ShieldCheck className="text-background" />}
              label="Misiones"
              value={`${progress.completedMissions.length} / ${missions.length}`}
              color="hsl(72, 54%, 65%)"
            />
          </CardContent>
        </Card>
        {energy < 50 && (
          <Card className="bg-destructive/80 text-destructive-foreground border-destructive">
            <CardContent className="p-4 h-full flex items-center justify-center text-center">
              <div>
                <p className="font-bold font-headline">¡La Energía es Crítica!</p>
                <p className="text-xs">Tu aldea necesita energía para prosperar.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mapa de la Aldea dentro de un card para un look consistente */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Village
            energy={energy}
            onDeduct={(amount) => addScore(-amount)}
            onRefund={(amount) => addScore(amount)}
          />
        </CardContent>
      </Card>

      <GuidanceTool />
    </div>
  );
}
