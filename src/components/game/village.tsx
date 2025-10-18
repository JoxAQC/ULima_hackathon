
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGameProgress } from '@/hooks/use-game-progress';
import { artifacts as artifactData } from '@/lib/village-data';

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

export type MarketItem = {
  key: string;
  name: string;
  cost: number;
  category: string;
  imageUrl: string;
};


const ARTIFACT_SIZE = 64;
const WORLD_SIZE = 5000;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

const Village = ({ energy, onDeduct, onRefund }: VillageProps) => {
  const points = energy;

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

  const [camera, setCamera] = useState({ x: -WORLD_SIZE / 2 + 300, y: -WORLD_SIZE / 2 + 300, scale: 0.8 });

  useEffect(() => {
    localStorage.setItem('village_placements', JSON.stringify(placements));
  }, [placements]);

  const artifactsByKey = useMemo(() => {
    const m = new Map<string, MarketItem>();
    artifactData.forEach(a => m.set(a.key, a));
    return m;
  }, [artifactData]);

  const startPurchase = (key: string) => {
    const art = artifactsByKey.get(key);
    if (!art) return;
    if (points < art.cost) return;
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
    const wx = (sx - camera.x) / camera.scale;
    const wy = (sy - camera.y) / camera.scale;
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

  const clearMap = () => {
     placements.forEach(p => {
      const artifactDef = artifactsByKey.get(p.key);
      if (artifactDef) onRefund(artifactDef.cost);
    });
    setPlacements([]);
  }

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

  const rotateSelected = (delta: number) => {
    if (selectedArtifact == null) return;
    setPlacements(prev => prev.map(p => p.id === selectedArtifact ? { ...p, rot: (((p.rot ?? 0) + delta) % 360 + 360) % 360 } : p));
  };
  const flipSelected = () => {
    if (selectedArtifact == null) return;
    setPlacements(prev => prev.map(p => p.id === selectedArtifact ? { ...p, flipH: !p.flipH } : p));
  };

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
  const resetView = () => setCamera({ x: -WORLD_SIZE / 2 + 300, y: -WORLD_SIZE / 2 + 300, scale: 0.8 });

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

  return (
    <div className="relative w-full h-[70vh] flex flex-col gap-4">
        <style jsx>{`
            .toolbar {
                position: absolute;
                top: 0.5rem;
                left: 0.5rem;
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                z-index: 20;
            }
            .toolbar button {
                padding: 0.5rem 1rem;
                border: 1px solid hsl(var(--border));
                background-color: hsl(var(--card));
                color: hsl(var(--card-foreground));
                border-radius: var(--radius);
                font-size: 0.875rem;
                cursor: pointer;
            }
            .toolbar button:hover {
                background-color: hsl(var(--muted));
            }
            .toolbar button.edit-mode-active {
                background-color: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
            }
             .toolbar button.cancel {
                background-color: hsl(var(--destructive) / 0.8);
                color: hsl(var(--destructive-foreground));
            }
             .toolbar button.delete-btn {
                background-color: hsl(var(--destructive));
                color: hsl(var(--destructive-foreground));
            }


            .game-area {
                flex-grow: 1;
                position: relative;
                overflow: hidden;
                background-color: #386641;
                cursor: grab;
            }
            .game-area.dragging {
                cursor: grabbing;
            }
            .world {
                position: absolute;
                top: 0;
                left: 0;
                background-image: url('/world.png');
                background-size: cover;
                transform-origin: 0 0;
            }
            .artifact {
                width: ${ARTIFACT_SIZE}px;
                height: ${ARTIFACT_SIZE}px;
                user-select: none;
                -webkit-user-drag: none;
            }
            .artifact.editable {
                cursor: pointer;
            }
            .artifact.selected {
                outline: 2px dashed hsl(var(--primary));
                outline-offset: 2px;
            }
            .artifact.preview {
                opacity: 0.7;
                pointer-events: none;
            }
            .place-hint, .edit-hint {
                position: absolute;
                bottom: 4rem;
                left: 50%;
                transform: translateX(-50%);
                background-color: hsla(var(--background), 0.8);
                padding: 0.5rem 1rem;
                border-radius: var(--radius);
                z-index: 10;
                pointer-events: none;
            }
            .zoom-controls {
                position: absolute;
                bottom: 4rem;
                right: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                z-index: 20;
            }
            .zoom-controls button {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 9999px;
                border: 1px solid hsl(var(--border));
                background-color: hsl(var(--card));
                color: hsl(var(--card-foreground));
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `}</style>
      <div className="toolbar">
        <Button onClick={() => { setEditMode(!editMode); setSelectedArtifact(null); if (pendingArtifact) cancelPlacement(); }} className={cn(editMode && 'bg-primary text-primary-foreground hover:bg-primary/90')} title="Activar modo edición para mover/eliminar artefactos">{editMode ? '✓ Modo Edición' : '✏️ Editar'}</Button>
        <Button variant="outline" onClick={clearMap} title="Quitar todos los artefactos del mapa">Limpiar</Button>
        {pendingArtifact && (
          <>
            <Button variant="destructive" onClick={cancelPlacement} title="Cancelar y reembolsar">Cancelar</Button>
            <Button variant="outline" onClick={() => setPendingRotation(r => (((r - 15) % 360) + 360) % 360)} title="Rotar 15° a la izquierda (Q)">↺</Button>
            <Button variant="outline" onClick={() => setPendingRotation(r => (((r + 15) % 360) + 360) % 360)} title="Rotar 15° a la derecha (E)">↻</Button>
            <Button variant="outline" onClick={() => setPendingFlipH(f => !f)} title="Espejo horizontal (F)">⇋</Button>
          </>
        )}
        {editMode && selectedArtifact && (
          <>
            <Button variant="destructive" onClick={() => deleteArtifact(selectedArtifact)} title="Eliminar artefacto seleccionado y recuperar puntos">🗑️ Eliminar</Button>
            <Button variant="outline" onClick={() => rotateSelected(-15)} title="Rotar seleccionado 15° a la izquierda (Q)">↺</Button>
            <Button variant="outline" onClick={() => rotateSelected(15)} title="Rotar seleccionado 15° a la derecha (E)">↻</Button>
            <Button variant="outline" onClick={flipSelected} title="Espejo horizontal del seleccionado (F)">⇋</Button>
          </>
        )}
      </div>

      <div
        ref={mapRef}
        className={cn("game-area", draggingRef.current && "dragging", (pendingArtifact || editMode) && "cursor-crosshair")}
        onClick={handleMapClick as any}
        onMouseMove={(e) => { if (isDraggingArtifact) { handleArtifactMouseMove(e as any); } else { handleMapMove(e as any); onMouseMove(e as any); } }}
        onMouseDown={onMouseDown as any}
        onMouseUp={(e) => { handleArtifactMouseUp(e as any); endDrag(); }}
        onMouseLeave={(e) => { handleArtifactMouseUp(e as any); endDrag(); setHoverPos(null) }}
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
                className={cn(`artifact relative overflow-hidden`, editMode && 'editable', selectedArtifact === p.id && 'selected')}
                style={{ left: p.x, top: p.y, position: 'absolute', transform: `${p.flipH ? 'scaleX(-1) ' : ''}rotate(${p.rot ?? 0}deg)`, transformOrigin: 'center' }}
                aria-label={`${p.key} colocado`}
                onClick={(e) => handleArtifactClick(e as any, p.id)}
                onMouseDown={(e) => handleArtifactMouseDown(e as any, p.id)}
              >
                {art ? (
                  <Image src={art.imageUrl} alt={art.name} fill className="object-contain pointer-events-none" />
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
        {editMode && <div className="edit-hint">{selectedArtifact ? 'Puedes mover, rotar o eliminar el objeto seleccionado' : 'Modo edición: Haz clic en un objeto para seleccionarlo'}</div>}

        <div className="zoom-controls" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <button aria-label="Acercar" onClick={zoomIn}>＋</button>
          <button aria-label="Alejar" onClick={zoomOut}>－</button>
          <button aria-label="Reiniciar vista" onClick={resetView}>⟲</button>
        </div>
      </div>

      <div className="w-full flex justify-center absolute bottom-0 left-1/2 -translate-x-1/2">
        <Sheet open={marketOpen} onOpenChange={setMarketOpen}>
          <SheetTrigger asChild>
            <Button className="font-headline mb-2 shadow-lg" disabled={!!pendingArtifact || editMode}>
              🏪 Mercado
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-4 max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Mercado</SheetTitle>
            </SheetHeader>
            {Array.from(new Set(artifactData.map(a => a.category))).map((cat: string) => (
              <div key={cat} className="space-y-3">
                <h3 className="font-headline font-bold text-base">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artifactData.filter(a => a.category === cat).map(a => {
                    const canAfford = points >= a.cost;
                    return (
                      <div key={a.key} className="flex items-center gap-3 rounded-md border bg-card/80 p-3">
                        <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden border bg-white">
                          <Image src={a.imageUrl} alt={a.name} fill className="object-contain" />
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

    