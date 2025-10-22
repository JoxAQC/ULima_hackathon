'use client';

import { useUser } from '@/context/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/layout/bottom-nav';

// 1. YA NO importas OfflineChat aquí
// import OfflineChat from '@/components/OfflineChat/OfflineChat'; 

// 2. IMPORTAS el nuevo ChatWidget
import ChatWidget from '@/components/ChatWidget'; // Asegúrate que la ruta sea correcta

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/create-profile');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    // Contenedor principal relativo para que z-index funcione bien
    <div className="relative min-h-screen">
      <main className="pb-20">
        {children}
        
        {/* 3. El OfflineChat que estaba aquí se ELIMINA */}
        
      </main>
      
      {/* Tu barra de navegación inferior */}
      <BottomNav />

      {/* 4. AÑADES el ChatWidget aquí */}
      {/* Al estar fuera de <main> y tener 'position: fixed', 
          flotará sobre todo el contenido y la barra de navegación. */}
      <ChatWidget />
    </div>
  );
}