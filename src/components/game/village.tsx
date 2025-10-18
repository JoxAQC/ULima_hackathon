'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface VillageProps {
  energy: number;
  onDeduct: (amount: number) => void;
  onRefund: (amount: number) => void;
}

type Placement = {
  id: number;
  key: string;
  x: number;
  y: number;
  rot?: number;
  flipH?: boolean;
};

const ARTIFACT_SIZE = 48;
const WORLD_SIZE = 5000;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

const Village = ({ energy, onDeduct, onRefund }: VillageProps) => {
  // Use global game progress (energy) so the marketplace is consistent with the rest of the app
  const points = energy;

  type MarketItem = {
    key: string;
    name: string;
    cost: number;
    category: string;
    imageUrl: string;
  };

  const [pendingArtifact, setPendingArtifact] = useState<null | MarketItem>(null);
  const [pendingRotation, setPendingRotation] = useState<number>(0);
  const [pendingFlipH, setPendingFlipH] = useState<boolean>(false);
  const [placements, setPlacements] = useState<Placement[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('village_placements');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<number | null>(null);
  const [isDraggingArtifact, setIsDraggingArtifact] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const touchesRef = useRef<any[]>([]);

  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    localStorage.setItem('village_points', String(points));
  }, [points]);
  useEffect(() => {
    localStorage.setItem('village_placements', JSON.stringify(placements));
  }, [placements]);

  const artifacts = useMemo<MarketItem[]>(() => {
    // Items del mercado (independientes de misiones)
    return [
      { key: 'solar-lamp',   name: 'Lámpara Solar',         cost: 100, category: 'Luz',            imageUrl: '/lamparasolar.png' },
      { key: 'water-filter', name: 'Filtro de Agua Casero', cost: 100, category: 'Agua',           imageUrl: '/filtroagua.png' },
      { key: 'mud-stove',    name: 'Estufa de Barro',       cost: 150, category: 'Cocina',         imageUrl: '/estufabarro.png' },
      { key: 'composting',   name: 'Pila de Compost',       cost: 75,  category: 'Sostenibilidad', imageUrl: '/composta.png' },
      { key: 'casa',         name: 'Casa',                  cost: 200, category: 'Edificios',      imageUrl: '/casa.png' },
      { key: 'jardin-flores',name: 'Jardín de Flores',      cost: 60,  category: 'Jardín',         imageUrl: '/jardinflores.png' },
      // Nuevos elementos
      { key: 'auquenidos',             name: 'Auquénidos',               cost: 120, category: 'Animales',        imageUrl: '/auquenidos.png' },
      { key: 'caballero',              name: 'Caballero',                cost: 180, category: 'Personajes',      imageUrl: '/caballero.png' },
      { key: 'chaman-inca',            name: 'Chamán Inca',              cost: 160, category: 'Personajes',      imageUrl: '/chaman_inca.png' },
      { key: 'comerciante',            name: 'Comerciante',              cost: 140, category: 'Personajes',      imageUrl: '/comerciante.png' },
      { key: 'comerciante-medico',     name: 'Comerciante Médico',       cost: 150, category: 'Personajes',      imageUrl: '/comerciante_medico.png' },
      { key: 'entrenamiento-inca',     name: 'Entrenamiento Inca',       cost: 130, category: 'Entrenamiento',   imageUrl: '/entrenamiento_inca.png' },
      { key: 'entrenamiento-medieval', name: 'Entrenamiento Medieval',   cost: 130, category: 'Entrenamiento',   imageUrl: '/entrenamiento_medieval.png' },
      { key: 'fuente-agua',            name: 'Fuente de Agua',           cost: 110, category: 'Decoración',      imageUrl: '/fuente_agua.png' },
      { key: 'fuente-chavin',          name: 'Fuente Chavín',            cost: 115, category: 'Decoración',      imageUrl: '/fuente_chavin.png' },
      { key: 'guardian-inca',          name: 'Guardián Inca',            cost: 170, category: 'Personajes',      imageUrl: '/guardian_inca.png' },
      { key: 'mago',                   name: 'Mago',                     cost: 200, category: 'Personajes',      imageUrl: '/mago.png' },
      { key: 'vaca-chanchos',          name: 'Vaca y Chanchos',          cost: 140, category: 'Animales',        imageUrl: '/vaca_chanchos.png' },
      // Nuevos elementos adicionales
      { key: 'hulca',                  name: 'Hulca',                    cost: 150, category: 'Personajes',      imageUrl: '/hulca.png' },
      { key: 'condor',                 name: 'Cóndor',                   cost: 130, category: 'Animales',        imageUrl: '/condor.png' },
      { key: 'estatua-dragon',         name: 'Estatua de Dragón',        cost: 180, category: 'Decoración',      imageUrl: '/estatua_dragon.png' },
      { key: 'balsa-totora',           name: 'Balsa de Totora',          cost: 140, category: 'Transporte',      imageUrl: '/balsa_totora.png' },
      { key: 'mercado',                name: 'Mercado',                  cost: 160, category: 'Edificios',       imageUrl: '/mercado.png' },
      { key: 'templo-inca',            name: 'Templo Inca',              cost: 220, category: 'Edificios',       imageUrl: '/templo_inca.png' },
    ];
  }, []);

  const artifactsByKey = useMemo(() => {
    const m = new Map<string, MarketItem>();
    artifacts.forEach(a => m.set(a.key, a));
    return m;
  }, [artifacts]);

  // Start purchase: deduct energy immediately
  const startPurchase = (key: string) => {
    const art = artifactsByKey.get(key);
    if (!art) return;
    if (points < art.cost) return; // require enough global energy
    onDeduct(art.cost);
    setPendingArtifact(art);
    setPendingRotation(0);
    setPendingFlipH(false);
  };

  const cancelPlacement = () => {
    if (!pendingArtifact) return;
    const art = artifactsByKey.get(pendingArtifact.key);
    if (art) onRefund(art.cost);
    setPendingArtifact(null);
    setPendingRotation(0);
    setPendingFlipH(false);
    setHoverPos(null);
  };

  const clampToWorld = (x: number, y: number) => {
    const maxX = WORLD_SIZE - ARTIFACT_SIZE;
    const maxY = WORLD_SIZE - ARTIFACT_SIZE;
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
  };

  const getWorldPosFromEvent = (event: React.MouseEvent) => {
    const rect = mapRef.current!.getBoundingClientRect();
    const sx = (event as any).clientX - rect.left;
    const sy = (event as any).clientY - rect.top;
    const wx = (sx - camera.x) / camera.scale - ARTIFACT_SIZE / 2;
    const wy = (sy - camera.y) / camera.scale - ARTIFACT_SIZE / 2;
    return clampToWorld(wx, wy);
  };

  const handleMapClick = (event: React.MouseEvent) => {
    if (!pendingArtifact) return;
    const { x, y } = getWorldPosFromEvent(event);
    const newPlacement: Placement = { id: Date.now(), key: pendingArtifact.key, x, y, rot: pendingRotation, flipH: pendingFlipH };
    setPlacements(prev => [...prev, newPlacement]);
    setPendingArtifact(null);
    setPendingRotation(0);
    setPendingFlipH(false);
    setHoverPos(null);
  };

  const handleMapMove = (event: React.MouseEvent) => {
    if (!pendingArtifact) return;
    setHoverPos(getWorldPosFromEvent(event));
  };

  const clearMap = () => setPlacements([]);

  const deleteArtifact = (artifactId: number) => {
    const artifact = placements.find(p => p.id === artifactId);
    if (!artifact) return;
    const artifactDef = artifactsByKey.get(artifact.key);
    if (artifactDef) onRefund(artifactDef.cost);
    setPlacements(prev => prev.filter(p => p.id !== artifactId));
    setSelectedArtifact(null);
  };

  const handleArtifactClick = (e: React.MouseEvent, artifactId: number) => {
    if (!editMode) return;
    e.stopPropagation();
    setSelectedArtifact(artifactId);
  };

  const handleArtifactMouseDown = (e: React.MouseEvent, artifactId: number) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedArtifact(artifactId);
    setIsDraggingArtifact(true);
    draggingRef.current = false;
  };

  const handleArtifactMouseMove = (e: React.MouseEvent) => {
    if (!editMode || !isDraggingArtifact || selectedArtifact == null) return;
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getWorldPosFromEvent(e);
    setPlacements(prev => prev.map(p => p.id === selectedArtifact ? { ...p, x, y } : p));
  };

  const handleArtifactMouseUp = (e?: React.MouseEvent) => {
    if (isDraggingArtifact) {
      e?.stopPropagation();
      e?.preventDefault();
    }
    setIsDraggingArtifact(false);
  };

  // Rotar y espejar en modo edición
  const rotateSelected = (delta: number) => {
    if (selectedArtifact == null) return;
    setPlacements(prev => prev.map(p => p.id === selectedArtifact ? { ...p, rot: (((p.rot ?? 0) + delta) % 360 + 360) % 360 } : p));
  };
  const flipSelected = () => {
    if (selectedArtifact == null) return;
    setPlacements(prev => prev.map(p => p.id === selectedArtifact ? { ...p, flipH: !p.flipH } : p));
  };

  // Atajos de teclado: Q/E rotar, R reset preview, F espejo horizontal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'q') {
        if (pendingArtifact) setPendingRotation(r => (((r - 15) % 360) + 360) % 360);
        else if (selectedArtifact != null) rotateSelected(-15);
      } else if (key === 'e') {
        if (pendingArtifact) setPendingRotation(r => (((r + 15) % 360) + 360) % 360);
        else if (selectedArtifact != null) rotateSelected(15);
      } else if (key === 'r') {
        if (pendingArtifact) setPendingRotation(0);
      } else if (key === 'f') {
        if (pendingArtifact) setPendingFlipH(f => !f);
        else if (selectedArtifact != null) flipSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingArtifact, selectedArtifact]);

  // Pan/zoom mouse
  const onMouseDown = (e: React.MouseEvent) => {
    if (pendingArtifact || editMode) return;
    if ((e as any).button !== 0) return;
    draggingRef.current = true;
    lastPointerRef.current = { x: (e as any).clientX, y: (e as any).clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const dx = (e as any).clientX - lastPointerRef.current.x;
    const dy = (e as any).clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: (e as any).clientX, y: (e as any).clientY };
    setCamera(c => ({ ...c, x: c.x + dx, y: c.y + dy }));
  };
  const endDrag = () => { draggingRef.current = false; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if ((e as any).ctrlKey) return;
    const dir = e.deltaY < 0 ? 1 : -1;
    const rect = mapRef.current!.getBoundingClientRect();
    const mouseX = (e as any).clientX - rect.left;
    const mouseY = (e as any).clientY - rect.top;
    const zoomFactor = dir > 0 ? 1.1 : 1 / 1.1;
    zoomAtPoint(zoomFactor, mouseX, mouseY);
  };

  const zoomAtPoint = (factor: number, screenX: number, screenY: number) => {
    setCamera(c => {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, c.scale * factor));
      if (newScale === c.scale) return c;
      const worldX = (screenX - c.x) / c.scale;
      const worldY = (screenY - c.y) / c.scale;
      const newX = screenX - worldX * newScale;
      const newY = screenY - worldY * newScale;
      return { x: newX, y: newY, scale: newScale };
    });
  };
  const zoomIn = () => {
    const rect = mapRef.current!.getBoundingClientRect();
    zoomAtPoint(1.2, rect.width / 2, rect.height / 2);
  };
  const zoomOut = () => {
    const rect = mapRef.current!.getBoundingClientRect();
    zoomAtPoint(1 / 1.2, rect.width / 2, rect.height / 2);
  };
  const resetView = () => setCamera({ x: 0, y: 0, scale: 1 });

  // Touch pan/pinch
  const onTouchStart = (e: React.TouchEvent) => {
    if (pendingArtifact) return;
    const touches = Array.from(e.touches);
    touchesRef.current = touches.map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
    if (touches.length === 1) {
      draggingRef.current = true;
      lastPointerRef.current = { x: touches[0].clientX, y: touches[0].clientY };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = Array.from(e.touches);
    if (draggingRef.current && touches.length === 1 && !pendingArtifact) {
      const dx = touches[0].clientX - lastPointerRef.current.x;
      const dy = touches[0].clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: touches[0].clientX, y: touches[0].clientY };
      setCamera(c => ({ ...c, x: c.x + dx, y: c.y + dy }));
    } else if (touches.length === 2 && touchesRef.current.length === 2) {
      const prevTouches = touchesRef.current;
      const prevDist = Math.hypot(prevTouches[1].x - prevTouches[0].x, prevTouches[1].y - prevTouches[0].y);
      const currDist = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
      if (prevDist > 0) {
        const factor = currDist / prevDist;
        const rect = mapRef.current!.getBoundingClientRect();
        const centerX = ((touches[0].clientX + touches[1].clientX) / 2) - rect.left;
        const centerY = ((touches[0].clientY + touches[1].clientY) / 2) - rect.top;
        zoomAtPoint(factor, centerX, centerY);
      }
      touchesRef.current = touches.map(t => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
    }
  };
  const onTouchEnd = () => { draggingRef.current = false; touchesRef.current = []; };

  // Render
  return (
    <div className="relative w-full h-full flex flex-col gap-4">
      {/* Herramientas */}
      <div className="toolbar">
        <button onClick={() => { setEditMode(!editMode); setSelectedArtifact(null); setPendingArtifact(null); }} className={editMode ? 'edit-mode-active' : ''} title="Activar modo edición para mover/eliminar artefactos">{editMode ? '✓ Modo Edición' : '✏️ Editar'}</button>
        <button onClick={clearMap} title="Quitar todos los artefactos del mapa">Limpiar mapa</button>
        {pendingArtifact && (
          <>
            <button className="cancel" onClick={cancelPlacement} title="Cancelar y reembolsar">Cancelar colocación ({pendingArtifact.name})</button>
            <button onClick={() => setPendingRotation(r => (((r - 15) % 360) + 360) % 360)} title="Rotar 15° a la izquierda">↺ Rotar</button>
            <button onClick={() => setPendingRotation(r => (((r + 15) % 360) + 360) % 360)} title="Rotar 15° a la derecha">↻ Rotar</button>
            <button onClick={() => setPendingFlipH(f => !f)} title="Espejo horizontal">⇋ Espejo</button>
          </>
        )}
        {editMode && selectedArtifact && (
          <>
            <button className="delete-btn" onClick={() => deleteArtifact(selectedArtifact)} title="Eliminar artefacto seleccionado y recuperar puntos">🗑️ Eliminar</button>
            <button onClick={() => rotateSelected(-15)} title="Rotar seleccionado 15° a la izquierda">↺ Rotar</button>
            <button onClick={() => rotateSelected(15)} title="Rotar seleccionado 15° a la derecha">↻ Rotar</button>
            <button onClick={flipSelected} title="Espejo horizontal del seleccionado">⇋ Espejo</button>
          </>
        )}
      </div>

      <div
        ref={mapRef}
        className={`game-area ${draggingRef.current ? 'dragging' : ''}`}
        onClick={handleMapClick as any}
        onMouseMove={(e) => { if (isDraggingArtifact) { handleArtifactMouseMove(e as any); } else { handleMapMove(e as any); onMouseMove(e as any); } }}
        onMouseDown={onMouseDown as any}
        onMouseUp={(e) => { handleArtifactMouseUp(e as any); endDrag(); }}
        onMouseLeave={(e) => { handleArtifactMouseUp(e as any); endDrag(); }}
        onWheel={onWheel as any}
        onTouchStart={onTouchStart as any}
        onTouchMove={onTouchMove as any}
        onTouchEnd={onTouchEnd as any}
        onTouchCancel={onTouchEnd as any}
      >
        <div className="world" style={{ width: WORLD_SIZE, height: WORLD_SIZE, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
          {placements.map(p => {
            const art = artifactsByKey.get(p.key);
            return (
              <div
                key={p.id}
                className={`artifact ${editMode ? 'editable' : ''} ${selectedArtifact === p.id ? 'selected' : ''} relative overflow-hidden`}
                style={{ left: p.x, top: p.y, position: 'absolute', transform: `${p.flipH ? 'scaleX(-1) ' : ''}rotate(${p.rot ?? 0}deg)`, transformOrigin: 'center' }}
                aria-label={`${p.key} colocado`}
                onClick={(e) => handleArtifactClick(e as any, p.id)}
                onMouseDown={(e) => handleArtifactMouseDown(e as any, p.id)}
              >
                {art ? (
                  <Image src={art.imageUrl} alt={art.name} fill className="object-contain" />
                ) : (
                  '🔧'
                )}
              </div>
            );
          })}

          {pendingArtifact && hoverPos && (
            <div className="artifact preview relative overflow-hidden" style={{ left: hoverPos.x, top: hoverPos.y, position: 'absolute', transform: `${pendingFlipH ? 'scaleX(-1) ' : ''}rotate(${pendingRotation}deg)`, transformOrigin: 'center' }} aria-hidden>
              <Image src={pendingArtifact.imageUrl} alt={pendingArtifact.name} fill className="object-contain" />
            </div>
          )}
        </div>

        {pendingArtifact && <div className="place-hint">Haz clic para colocar: {pendingArtifact.name}</div>}
        {editMode && <div className="edit-hint">{selectedArtifact ? '✏️ Clic en "Eliminar" para borrar' : '✏️ Modo edición: Haz clic en un artefacto para seleccionarlo'}</div>}

        <div className="zoom-controls" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <button aria-label="Acercar" onClick={zoomIn}>＋</button>
          <button aria-label="Alejar" onClick={zoomOut}>－</button>
          <button aria-label="Reiniciar vista" onClick={resetView}>⟲</button>
        </div>
      </div>

      {/* Mercado en menú hamburguesa (hoja inferior), trigger debajo del mapa */}
      <div className="w-full flex justify-center">
        <Sheet open={marketOpen} onOpenChange={setMarketOpen}>
          <SheetTrigger asChild>
            <Button className="font-headline mb-2" disabled={!!pendingArtifact || editMode}>
              🏪 Mercado
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-4 max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Mercado</SheetTitle>
            </SheetHeader>
            {/* Agrupar por categoría en listas compactas */}
            {Array.from(new Set(artifacts.map(a => a.category))).map((cat: string) => (
              <div key={cat} className="space-y-3">
                <h3 className="font-headline font-bold text-base">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artifacts.filter(a => a.category === cat).map(a => {
                    const canAfford = points >= a.cost;
                    return (
                      <div key={a.key} className="flex items-center gap-3 rounded-md border bg-card/80 p-3">
                        <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden border">
                          <Image src={a.imageUrl} alt={a.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-headline text-sm font-bold truncate">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.cost} Energía</div>
                        </div>
                        <Button
                          size="sm"
                          disabled={!canAfford || !!pendingArtifact || editMode}
                          onClick={() => { startPurchase(a.key); setMarketOpen(false); }}
                          title={editMode ? 'Desactiva modo edición primero' : !canAfford ? 'No alcanza la energía' : pendingArtifact ? 'Termina la colocación actual' : 'Comprar y colocar'}
                        >
                          Comprar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default Village;