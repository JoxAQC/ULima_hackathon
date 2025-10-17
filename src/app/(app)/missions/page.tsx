'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { missions } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function MissionsPage() {
  const { user } = useUser();
  if (!user) return null;

  const availableMissions = missions.filter(
    (mission) => mission.userSegment === 'All' || mission.userSegment === user.segment
  );

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Missions</h1>
        <p className="text-muted-foreground">Complete missions to earn rewards and grow!</p>
      </header>
      <div className="space-y-4">
        {availableMissions.map((mission) => {
          const isCompleted = user.progress.missionsCompleted.includes(mission.id);
          return (
          <Link href={`/missions/${mission.id}`} key={mission.id}>
            <Card className={`hover:border-primary transition-all ${isCompleted ? 'bg-muted/50' : 'bg-card'}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="mb-1">{mission.title}</CardTitle>
                  <CardDescription>{mission.description}</CardDescription>
                </div>
                <Badge variant={mission.category === 'Financial' ? 'default' : 'secondary'}>{mission.category}</Badge>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>{mission.exp} EXP</span>
                    <span className="text-lg">·</span>
                    <span>{mission.credits} Credits</span>
                </div>
                {isCompleted ? (
                   <Badge variant="outline">Completed</Badge>
                ) : (
                   <ArrowRight className="h-5 w-5 text-primary" />
                )}
              </CardContent>
            </Card>
          </Link>
        )})}
      </div>
    </div>
  );
}
