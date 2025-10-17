'use client';

import { useState } from 'react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/logo';
import { ArrowRight } from 'lucide-react';

export default function CreateProfile() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const { createUser } = useUser();
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim() && age) {
      const ageNum = parseInt(age, 10);
      if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
        createUser(name.trim(), ageNum);
      } else {
        setError('Please enter a valid age.');
      }
    } else {
      setError('Please fill in both fields.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 mb-2 text-primary" />
          <CardTitle className="text-2xl">Welcome to HIRI</CardTitle>
          <CardDescription>Let's get to know you a little better.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">What's your name?</Label>
              <Input
                id="name"
                placeholder="e.g., Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">How old are you?</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
             {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!name || !age}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
