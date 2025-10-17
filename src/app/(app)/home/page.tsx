
'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { communityMembers } from '@/lib/data';
import Image from 'next/image';
import { BarChart, CircleDollarSign, Leaf, Sparkles, Trophy } from 'lucide-react';

function AdultHome() {
  const { user } = useUser();

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">Bienvenido, {user?.name}!</h1>
        <p className="text-muted-foreground">Tu resumen de impacto y ahorro sostenible.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahorro Total</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {user?.progress.financialSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Estimado basado en misiones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Ahorrado</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.progress.co2Saved} kg</div>
            <p className="text-xs text-muted-foreground">¡Un gran impacto!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EXP</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.progress.exp}</div>
            <p className="text-xs text-muted-foreground">Nivel {Math.floor((user?.progress.exp || 0) / 1000) + 1}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Completaste la misión "Optimiza la Iluminación de tu Hogar".</p>
        </CardContent>
      </Card>
    </div>
  );
}

function YouthHome() {
  const { user } = useUser();
  const villageImage = PlaceHolderImages.find(img => img.id === 'youth-village');
  
  const members = user ? [...communityMembers.filter(m => m.name !== user.name), {id: 99, name: user.name, exp: user.progress.exp, avatar: 'avatar-1'}].sort((a,b) => b.exp - a.exp) : communityMembers;


  return (
    <div className="space-y-6">
      <header className="bg-village-background p-4 pt-8">
        <h1 className="text-2xl font-bold text-secondary-foreground">¡Bienvenido a tu Eco-Aldea, {user?.name}!</h1>
        <p className="text-muted-foreground">Sigue aprendiendo para hacer crecer tu comunidad.</p>
      </header>

      <div className="p-4 space-y-6">
        <Card className="overflow-hidden">
          {villageImage && (
            <div className="relative h-48 w-full">
              <Image src={villageImage.imageUrl} alt={villageImage.description} layout="fill" objectFit="cover" data-ai-hint={villageImage.imageHint} />
            </div>
          )}
          <CardHeader>
            <CardTitle>Progreso de mi Eco-Aldea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Nivel {Math.floor((user?.progress.exp || 0) / 1000) + 1}</span>
              <Progress value={(user?.progress.exp || 0) % 1000 / 10} />
              <span className="text-sm font-medium">Nivel {Math.floor((user?.progress.exp || 0) / 1000) + 2}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">{user?.progress.exp} / {((Math.floor((user?.progress.exp || 0) / 1000) + 1) * 1000)} EXP para el siguiente nivel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Ranking de la Comunidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {members.map((member, index) => {
                const avatar = PlaceHolderImages.find(p => p.id === member.avatar);
                const isCurrentUser = member.name === user?.name;
                return (
                  <li key={member.id} className={`flex items-center gap-4 p-2 rounded-md ${isCurrentUser ? 'bg-primary/10' : ''}`}>
                    <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                    <Avatar>
                      {avatar && <AvatarImage src={avatar.imageUrl} alt={member.name} />}
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className={`font-semibold ${isCurrentUser ? 'text-primary' : ''}`}>{member.name} {isCurrentUser && '(Tú)'}</p>
                      <p className="text-sm text-muted-foreground">{member.exp} EXP</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useUser();
  if (!user) return null;

  return user.segment === 'Adult' ? <AdultHome /> : <YouthHome />;
}
