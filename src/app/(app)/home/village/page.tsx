
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function VillagePage() {
    const villageImage = PlaceHolderImages.find(img => img.id === 'youth-village-dynamic');

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="secondary" size="icon">
          <Link href="/home">
            <ArrowLeft />
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen bg-village-background p-4 text-center">
        {villageImage && (
            <div className='relative w-64 h-64 mb-4'>
                <Image src={villageImage.imageUrl} alt={villageImage.description} layout="fill" objectFit="contain" data-ai-hint={villageImage.imageHint} />
            </div>
        )}
        <h1 className="text-2xl font-bold">Mi Eco-Aldea Dinámica</h1>
        <p className="text-muted-foreground">Este espacio será una representación interactiva de tu progreso.</p>
        <p className="mt-4 max-w-md mx-auto">Aquí podrás ver cómo tus misiones completadas hacen crecer tu aldea, con nuevos edificios y tecnologías sostenibles apareciendo a medida que avanzas.</p>
      </div>
    </div>
  );
}
