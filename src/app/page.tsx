'use client';

import Image from 'next/image';
import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/icons/logo';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/home');
      } else {
        router.replace('/create-profile');
      }
    }
  }, [user, isLoading, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* 🌄 Imagen de fondo */}
      <Image
        src="/welcome.jpg"   // tu imagen dentro de /public
        alt="Loading background"
        fill                    // ocupa todo el contenedor
        priority                // carga inmediata
        className="object-cover object-center"
      />

      {/* 🔲 Capa semitransparente opcional */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 💫 Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Logo className="h-16 w-16 text-white drop-shadow-lg" />
        <p className="text-white text-lg font-medium animate-pulse">
          Loading HIRI...
        </p>
      </div>
    </main>
  );
}
