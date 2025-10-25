// components/ChatWidget.jsx
'use client';

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import OfflineChat from '@/components/OfflineChat/OfflineChat'; 

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // CONTENEDOR PADRE:
    // Le añadimos 'pointer-events-none'
    // Esto hace que TODO el bloque (invisible) ignore los clics por defecto.
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none">
      
      {/* 1. VENTANA DEL CHAT */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 mb-2 pointer-events-auto' // <-- (Clickeable si está abierto)
            : 'opacity-0 translate-y-4 pointer-events-none'     // <-- (Ignorado si está cerrado)
        }`}
      >
        <OfflineChat />
      </div>

      {/* 2. BOTÓN FLOTANTE (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // Le añadimos 'pointer-events-auto' al botón
        // Esto "reactiva" los clics solo para el botón,
        // permitiendo que sea la única cosa clickeable cuando el chat está cerrado.
        className="p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 pointer-events-auto"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}