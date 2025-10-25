
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BookOpen, BrainCircuit, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const quizQuestions = [
  {
    question: "¿Qué es el voltaje?",
    options: ["El flujo de electrones", "La 'presión' que empuja la electricidad", "La resistencia al flujo", "La cantidad de energía consumida"],
    correctAnswer: "La 'presión' que empuja la electricidad",
  },
  {
    question: "¿Qué tipo de corriente proporciona una batería?",
    options: ["Corriente alterna (AC)", "Corriente directa (DC)", "Corriente pulsante", "Ninguna de las anteriores"],
    correctAnswer: "Corriente directa (DC)",
  },
];

export default function LearnPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const checkAnswers = () => {
    const newResults: Record<number, boolean> = {};
    quizQuestions.forEach((q, index) => {
      newResults[index] = answers[index] === q.correctAnswer;
    });
    setResults(newResults);
  };
  
  const totalCorrect = Object.values(results).filter(Boolean).length;
  const allAnswered = Object.keys(answers).length === quizQuestions.length;

  return (
    <div className="relative min-h-screen p-4 space-y-8">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="secondary" size="icon">
          <Link href="/missions">
            <ArrowLeft />
          </Link>
        </Button>
      </div>
      
      <header className="flex flex-col items-center justify-center pt-12 text-center">
        <div className="bg-secondary/20 p-4 rounded-full mb-4">
            <BookOpen className="h-12 w-12 text-secondary-foreground" />
        </div>
        <h1 className="text-4xl font-bold">Aprende con Energía</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Fortalece tus conocimientos sobre energías renovables y electricidad.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Guía Rápida: Conceptos Básicos de Electricidad</CardTitle>
          <CardDescription>Entender esto es clave para tus misiones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground">1. Voltaje (V)</h3>
            <p>Imagina una manguera de agua. El voltaje es como la presión del agua. Es la "fuerza" que empuja a los electrones a moverse. Se mide en Voltios.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">2. Corriente (A)</h3>
            <p>Siguiendo con la manguera, la corriente es como el caudal de agua que fluye. Es la cantidad de electrones que pasan por un punto. Se mide en Amperios.</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">3. Resistencia (Ω)</h3>
            <p>La resistencia es como apretar la manguera. Dificulta el paso de la corriente. Los materiales con alta resistencia (como el plástico) son aislantes, y los de baja resistencia (como el cobre) son conductores. Se mide en Ohmios.</p>
          </div>
           <div>
            <h3 className="font-semibold text-foreground">4. Corriente Directa (DC) vs. Corriente Alterna (AC)</h3>
            <p><span className="font-bold">DC:</span> Los electrones fluyen en una sola dirección. Es la que usan las baterías y los paneles solares. <br/><span className="font-bold">AC:</span> Los electrones cambian de dirección constantemente. Es la que llega a los enchufes de tu casa.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
              <BrainCircuit />
              Pon a Prueba tu Conocimiento
          </CardTitle>
          <CardDescription className="text-center">Responde correctamente y gana puntos de experiencia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quizQuestions.map((q, index) => (
            <div key={index}>
              <p className="font-medium mb-3">{index + 1}. {q.question}</p>
              <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)}>
                {q.options.map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`q${index}-${option}`} />
                    <Label htmlFor={`q${index}-${option}`} className="flex-1">
                      {option}
                      {results[index] !== undefined && answers[index] === option && (
                        results[index] 
                          ? <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                          : <XCircle className="inline ml-2 h-4 w-4 text-destructive" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {results[index] !== undefined && !results[index] && (
                 <p className="text-sm text-muted-foreground mt-2">Respuesta correcta: <span className="font-semibold">{q.correctAnswer}</span></p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button onClick={checkAnswers} disabled={!allAnswered || Object.keys(results).length > 0} className="w-full">
            Revisar Respuestas
          </Button>
          {Object.keys(results).length > 0 && (
            <p className="text-lg font-bold">
              Resultado: {totalCorrect} de {quizQuestions.length} correctas. ¡Has ganado {totalCorrect * 10} EXP!
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
