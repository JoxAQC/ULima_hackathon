'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon, DollarSign, Award, Target, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { missions } from '@/lib/data';

const savingsData = [
  { month: 'Jan', savings: 10 },
  { month: 'Feb', savings: 25 },
  { month: 'Mar', savings: 40 },
  { month: 'Apr', savings: 50 },
  { month: 'May', savings: 75 },
  { month: 'Jun', savings: 100 },
];

function AdultImpact() {
  const { user } = useUser();

  const completedMissions = missions.filter(m => user?.progress.missionsCompleted.includes(m.id));

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My Impact</h1>
        <p className="text-muted-foreground">See the progress you've made on your financial journey.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /> Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${user?.progress.financialSavings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /> Missions Done</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.missionsCompleted.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp /> Savings Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={savingsData}>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
              <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Completed Missions</CardTitle>
        </CardHeader>
        <CardContent>
            {completedMissions.length > 0 ? (
                <ul className="space-y-2">
                    {completedMissions.map(m => <li key={m.id} className="text-muted-foreground">{m.title}</li>)}
                </ul>
            ) : (
                <p className="text-muted-foreground">No missions completed yet. Go complete one!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function YouthImpact() {
  const { user } = useUser();
  const level = Math.floor((user?.progress.exp || 0) / 1000) + 1;
  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">My Impact</h1>
        <p className="text-muted-foreground">Check out your awesome achievements!</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-secondary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Award className="h-4 w-4" /> Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><BarChartIcon className="h-4 w-4" /> Total EXP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.exp}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /> HIRI Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.credits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /> Missions Done</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.progress.missionsCompleted.length}</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Badges Earned</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">You'll be able to see your badges here soon!</p>
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
