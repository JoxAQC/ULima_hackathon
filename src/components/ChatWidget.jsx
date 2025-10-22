// components/ChatWidget.jsx
'use client';

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
// Importa tu componente de chat existente
import OfflineChat from '@/components/OfflineChat/OfflineChat'; 

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // Contenedor fijo en la esquina inferior derecha
    // bottom-24 está calculado para flotar sobre tu BottomNav (que deja pb-20)
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      
      {/* Ventana del Chat (OfflineChat)
        La renderizamos siempre para que el useEffect de carga del modelo se 
        ejecute al cargar la página.
        Solo controlamos su visibilidad con CSS para la animación.
      */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 mb-2 visible'
            : 'opacity-0 translate-y-4 invisible' // 'invisible' lo oculta de la accesibilidad y clics
        }`}
      >
        {/* Aquí usamos tu componente original sin modificarlo */}
        <OfflineChat />
      </div>

      {/* Botón Flotante (FAB) para abrir/cerrar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {/* Cambia el ícono según el estado */}
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}