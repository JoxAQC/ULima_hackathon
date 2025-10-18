
'use client';

import { useUser } from '@/context/user-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LogOut, User as UserIcon, Award, Sparkles, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, clearUser } = useUser();
  const avatar = PlaceHolderImages.find((p) => p.id === 'avatar-1');

  if (!user) return null;
  
  const level = Math.floor(user.progress.exp / 1000) + 1;

  return (
    <div className="p-4 space-y-6">
      <header className="flex flex-col items-center pt-8 space-y-2 text-center">
        <Avatar className="h-24 w-24 border-4 border-card">
          {avatar && <AvatarImage src={avatar.imageUrl} alt={user.name} />}
          <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p className="text-muted-foreground">
          {user.segment}, {user.age} años
        </p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle className='text-center'>Mi Progreso</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-1">
                <Award className="h-8 w-8 text-primary"/>
                <p className="text-2xl font-bold">{level}</p>
                <p className="text-xs text-muted-foreground">Nivel</p>
            </div>
             <div className="flex flex-col items-center space-y-1">
                <Sparkles className="h-8 w-8 text-yellow-500"/>
                <p className="text-2xl font-bold">{user.progress.exp}</p>
                <p className="text-xs text-muted-foreground">EXP</p>
            </div>
             <div className="flex flex-col items-center space-y-1">
                <DollarSign className="h-8 w-8 text-green-500"/>
                <p className="text-2xl font-bold">{user.progress.credits}</p>
                <p className="text-xs text-muted-foreground">Créditos</p>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className='text-center'>Ajustes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">Información de Cuenta</Button>
          <Separator/>
          <Button variant="ghost" className="w-full justify-start">Notificaciones</Button>
           <Separator/>
          <Button variant="ghost" className="w-full justify-start">Ayuda y Soporte</Button>
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={clearUser} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  );
}
