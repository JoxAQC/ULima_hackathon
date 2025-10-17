'use client';

import { useUser } from '@/context/user-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { communityMembers } from '@/lib/data';
import Image from 'next/image';
import { BarChart, CircleDollarSign, PiggyBank, Sparkles, Trophy } from 'lucide-react';

function AdultHome() {
  const { user } = useUser();

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">Here's your financial overview.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${user?.progress.financialSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HIRI Credits</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.progress.credits}</div>
            <p className="text-xs text-muted-foreground">+5 from last mission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EXP</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.progress.exp}</div>
            <p className="text-xs text-muted-foreground">Level 3</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You completed "Create a Monthly Budget" mission.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function YouthHome() {
  const { user } = useUser();
  const villageImage = PlaceHolderImages.find(img => img.id === 'youth-village');
  
  const userRank = communityMembers.findIndex(member => member.name === user?.name) + 1 || communityMembers.length + 1;
  const members = user ? [...communityMembers.filter(m => m.name !== user.name), {id: 99, name: user.name, exp: user.progress.exp, avatar: 'avatar-1'}].sort((a,b) => b.exp - a.exp) : communityMembers;


  return (
    <div className="space-y-6">
      <header className="bg-village-background p-4 pt-8">
        <h1 className="text-2xl font-bold text-secondary-foreground">Welcome to your Village, {user?.name}!</h1>
        <p className="text-muted-foreground">Keep learning to grow your community.</p>
      </header>

      <div className="p-4 space-y-6">
        <Card className="overflow-hidden">
          {villageImage && (
            <div className="relative h-48 w-full">
              <Image src={villageImage.imageUrl} alt={villageImage.description} layout="fill" objectFit="cover" data-ai-hint={villageImage.imageHint} />
            </div>
          )}
          <CardHeader>
            <CardTitle>My Village Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Level 3</span>
              <Progress value={(user?.progress.exp || 0) % 1000 / 10} />
              <span className="text-sm font-medium">Level 4</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">{user?.progress.exp} / 1000 EXP to next level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Community Ranking</CardTitle>
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
                      <p className={`font-semibold ${isCurrentUser ? 'text-primary' : ''}`}>{member.name} {isCurrentUser && '(You)'}</p>
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
