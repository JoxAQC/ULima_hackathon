
'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon, DollarSign, Award, Target, TrendingUp, Leaf } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { missions } from '@/lib/data';

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
      <header>
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
          <CardTitle className="flex items-center gap-2"><TrendingUp /> Ahorro a lo Largo del Tiempo</CardTitle>
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
            <CardTitle>Misiones Completadas</CardTitle>
        </CardHeader>
        <CardContent>
            {completedMissions.length > 0 ? (
                <ul className="space-y-2">
                    {completedMissions.map(m => <li key={m.id} className="text-muted-foreground">{m.title}</li>)}
                </ul>
            ) : (
                <p className="text-muted-foreground">Aún no has completado misiones. ¡Ve a completar una!</p>
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

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Mi Impacto</h1>
        <p className="text-muted-foreground">¡Mira tus increíbles logros!</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary/50 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Leaf className="h-4 w-4" /> Impacto Ambiental</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user?.progress.co2Saved || 0} kg de CO₂ ahorrados</p>
            <p className="text-sm text-muted-foreground">¡Equivalente a plantar {treesPlanted} {treesPlanted === 1 ? 'árbol' : 'árboles'}!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Award className="h-4 w-4" /> Nivel Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChartIcon className="h-4 w-4" /> EXP Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.exp}</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Pines Ganados</CardTitle>
        </CardHeader>
        <CardContent>
            {user?.progress.missionsCompleted.length > 0 ? (
                 <div className="flex gap-2">
                    <div className="bg-yellow-200 text-yellow-800 p-2 rounded-full text-xs font-bold">Guardián Solar</div>
                 </div>
            ) : (
                <p className="text-muted-foreground">¡Completa misiones para ganar pines!</p>
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
