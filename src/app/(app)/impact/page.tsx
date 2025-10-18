
'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon, DollarSign, Award, Target, TrendingUp, Leaf, Lock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { missions } from '@/lib/data';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const savingsData = [
  { month: 'Ene', savings: 10 },
  { month: 'Feb', savings: 25 },
  { month: 'Mar', savings: 40 },
  { month: 'Abr', savings: 50 },
  { month: 'May', savings: 75 },
  { month: 'Jun', savings: 100 },
];

function AdultImpact() {
  const { user } = useUser();

  const completedMissions = missions.filter(m => user?.progress.missionsCompleted.includes(m.id));

  return (
    <div className="p-4 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Mi Impacto</h1>
        <p className="text-muted-foreground">Mira el progreso que has logrado en tu viaje hacia la sostenibilidad.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /> Total Ahorrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">S/ {user?.progress.financialSavings.toFixed(2)}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Leaf className="h-4 w-4" /> CO₂ Ahorrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.co2Saved || 0} kg</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center"><TrendingUp /> Ahorro a lo Largo del Tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={savingsData}>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `S/${value}`} />
              <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
              <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ahorro" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle  className="text-center">Misiones Completadas</CardTitle>
        </CardHeader>
        <CardContent>
            {completedMissions.length > 0 ? (
                <ul className="space-y-2 text-center">
                    {completedMissions.map(m => <li key={m.id} className="text-muted-foreground">{m.title}</li>)}
                </ul>
            ) : (
                <p className="text-muted-foreground text-center">Aún no has completado misiones. ¡Ve a completar una!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function YouthImpact() {
  const { user } = useUser();
  const level = Math.floor((user?.progress.exp || 0) / 1000) + 1;
  const treesPlanted = Math.floor((user?.progress.co2Saved || 0) / 20);

  const allPins = [
      { id: 1, title: "Guardián Solar", missionId: 1, imageHint: "solar lamp" },
      { id: 3, title: "Mago del Agua Caliente", missionId: 3, imageHint: "water heater" },
      { id: 5, title: "Maestro del Viento", missionId: 5, imageHint: "wind energy" }
  ];

  const earnedPins = allPins.filter(pin => user?.progress.missionsCompleted.includes(pin.missionId));
  const lockedPins = allPins.filter(pin => !user?.progress.missionsCompleted.includes(pin.missionId));

  return (
    <div className="p-4 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Mi Impacto</h1>
        <p className="text-muted-foreground">¡Mira tus increíbles logros!</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary/50 col-span-2 text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 justify-center"><Leaf className="h-6 w-6" /> Impacto Ambiental</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.co2Saved || 0} kg</p>
            <p className="text-sm text-muted-foreground">¡Equivalente a plantar {treesPlanted} {treesPlanted === 1 ? 'árbol' : 'árboles'}!</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 justify-center"><Award className="h-6 w-6" /> Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{level}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 justify-center"><BarChartIcon className="h-6 w-6" /> EXP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{user?.progress.exp}</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle className="text-center">Pines Ganados</CardTitle>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
                <div className="flex justify-center gap-4">
                    {earnedPins.map(pin => {
                        const pinImage = PlaceHolderImages.find(p => p.imageHint.includes(pin.imageHint));
                        return (
                             <ShadcnTooltip key={pin.id}>
                                <TooltipTrigger>
                                    <div className="relative w-20 h-20">
                                        {pinImage && <Image src={pinImage.imageUrl} alt={pin.title} layout="fill" objectFit="cover" className="rounded-full border-4 border-yellow-500" data-ai-hint={pin.imageHint}/>}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{pin.title}</p>
                                </TooltipContent>
                            </ShadcnTooltip>
                        )
                    })}
                    {lockedPins.map(pin => (
                         <ShadcnTooltip key={pin.id}>
                            <TooltipTrigger>
                                <div className="relative w-20 h-20">
                                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                                        <Lock className="h-8 w-8 text-muted-foreground"/>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Pin Bloqueado: {pin.title}</p>
                            </TooltipContent>
                        </ShadcnTooltip>
                    ))}
                </div>
            </TooltipProvider>

            {allPins.length === 0 && (
                <p className="text-muted-foreground text-center">¡Completa misiones para ganar pines!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ImpactPage() {
  const { user } = useUser();
  if (!user) return null;

  return user.segment === 'Adult' ? <AdultImpact /> : <YouthImpact />;
}
