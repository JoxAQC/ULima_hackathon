
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function LearnPage() {
  return (
    <div className="relative min-h-screen p-4">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="secondary" size="icon">
          <Link href="/missions">
            <ArrowLeft />
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen pt-12 text-center">
        <div className="bg-secondary/20 p-4 rounded-full mb-6">
            <BookOpen className="h-12 w-12 text-secondary-foreground" />
        </div>
        <h1 className="text-4xl font-bold">Aprende con Energía</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Este es el centro de conocimiento. Aquí encontrarás guías teóricas, conceptos clave y tests para validar lo que has aprendido.
        </p>

        <Card className="mt-8 w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <BrainCircuit />
                    Próximamente
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    ¡Estamos construyendo esta sección! Pronto podrás sumergirte en el fascinante mundo de la energía renovable.
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
