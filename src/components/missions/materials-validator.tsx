"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Lazy import to avoid SSR issues
let tasksVision: any = null;
async function ensureTasksVision() {
  if (tasksVision) return tasksVision;
  const mod = await import('@mediapipe/tasks-vision');
  tasksVision = mod;
  return tasksVision;
}

export type ValidatorResult = {
  ok: boolean;
  detailsHtml: string;
};

// Mapping of mission id to COCO proxy classes to detect
export const MISSION_EXPECTED: Record<number, { expected: string[]; mode: 'mvp_coco'; threshold?: number }> = {
  // 1: Lámpara Solar Casera (validamos herramientas genéricas y botellas)
  1: { expected: ['bottle','cup','scissors','knife','cell phone'], mode: 'mvp_coco', threshold: 0.5 },
  // 3: Calentador Solar de Agua (proxies sencillos visibles)
  3: { expected: ['bottle','cup','scissors','knife'], mode: 'mvp_coco', threshold: 0.5 },
  // 5: Molino de Viento Generador
  5: { expected: ['bottle','scissors','knife','cell phone'], mode: 'mvp_coco', threshold: 0.5 },
};

// Etiquetas en español amigables para mostrar al usuario
const SPANISH_LABELS: Record<string, string> = {
  'bottle': 'Botella',
  'cup': 'Taza/vaso',
  'scissors': 'Tijeras',
  'knife': 'Cuchillo/cúter',
  'cell phone': 'Celular (como herramienta/linterna)'
};

function toSpanish(labels: string[]): string[] {
  return labels.map(l => SPANISH_LABELS[l] || l);
}

function AdviceList(missionId: number, labels: string[]) {
  // Mensajes simples por etiqueta detectada/deseada
  if (missionId === 1) {
    const map: Record<string,string> = {
      bottle: 'Usa una botella limpia/transparente como cubierta o difusor.',
      scissors: 'Asegura cortes limpios y seguros para el montaje.',
      knife: 'Corta con cuidado y en superficie estable (seguridad).'
    };
    return labels.map(l => map[l] ? `<li>${map[l]}</li>` : '').join('');
  }
  if (missionId === 3) {
    const map: Record<string,string> = {
      bottle: 'Puedes usar botellas como recipientes auxiliares o indicadores.',
      scissors: 'Corta el plástico transparente para la tapa invernadero.',
      knife: 'Recorta la caja con cuidado para ajustar la tapa.'
    };
    return labels.map(l => map[l] ? `<li>${map[l]}</li>` : '').join('');
  }
  if (missionId === 5) {
    const map: Record<string,string> = {
      bottle: 'Botellas sirven para fabricar aspas ligeras.',
      scissors: 'Recorta aspas simétricas para mejor rendimiento.',
      knife: 'Ajusta perforaciones con cuidado para el eje.'
    };
    return labels.map(l => map[l] ? `<li>${map[l]}</li>` : '').join('');
  }
  return '';
}

export default function MaterialsValidator({ missionId, onValidated, onCancel }: { missionId: number; onValidated: (res: ValidatorResult) => void; onCancel: ()=>void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('Cargando…');
  const [ready, setReady] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const engineRef = useRef<any>(null);

  const missionCfg = MISSION_EXPECTED[missionId];
  const wantsValidation = !!missionCfg;
  const expectedList = missionCfg ? toSpanish(missionCfg.expected) : [];

  useEffect(() => {
    (async () => {
      try {
        const tv = await ensureTasksVision();
        const fileset = await tv.FilesetResolver.forVisionTasks('/mediapipe/wasm');
        // Try multiple model locations under /public
        const candidates = [
          // Directly under /public with exact folder name provided
          '/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/2.tflite',
          '/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/detect_meta.tflite',
          '/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/detect.tflite',
          // Sometimes kept under /public/models
          '/models/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/2.tflite',
          '/models/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/detect_meta.tflite',
          '/models/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/detect.tflite',
          // Fallback to short alias
          '/coco_ssd/2.tflite',
          '/coco_ssd/detect_meta.tflite',
          '/coco_ssd/detect.tflite'
        ];
        let chosen = '';
        for (const p of candidates) {
          try { const r = await fetch(p, { cache: 'no-store' }); if (r.ok) { chosen = p; break; } } catch {}
        }
        if (!chosen) { setStatus('⚠️ No se encontró el modelo COCO SSD en /coco_ssd.'); return; }
        const detector = await tv.ObjectDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: chosen },
          runningMode: 'IMAGE',
          scoreThreshold: 0.25,
          maxResults: 10,
        });
        engineRef.current = { kind: 'det', inst: detector };
        setReady(true);
        setStatus(`Listo: detección offline habilitada (${chosen}).`);
      } catch (e) {
        console.error(e);
        setStatus('Error al cargar recursos de visión.');
      }
    })();
  }, []);

  function onFilesChanged(list: FileList | null) {
    const fs = Array.from(list || []).filter(f => f.type.startsWith('image/')).slice(0,3);
    setFiles(fs);
    setPreviewUrls(fs.map(f => URL.createObjectURL(f)));
  }

  async function runValidation() {
    if (!ready || !engineRef.current) return;
    if (!wantsValidation) {
      onValidated({ ok: true, detailsHtml: '<p class="ok">Esta misión no requiere validación por imagen.</p>' });
      return;
    }
    if (files.length === 0) { setStatus('Sube al menos 1 foto.'); return; }
    const tv = await ensureTasksVision();
    const expected = missionCfg.expected;
    const thr = missionCfg.threshold ?? 0.5;

    const present: Record<string, number> = {};

    for (const f of files) {
      const bmp = await createImageBitmap(f);
      const res = await engineRef.current.inst.detect(bmp);
      for (const det of res.detections || []) {
        const cat = det.categories?.[0];
        if (!cat) continue;
        const name = (cat.categoryName || '').toLowerCase();
        const score = cat.score || 0;
        if (expected.includes(name)) present[name] = Math.max(present[name] || 0, score);
      }
    }

    const over = Object.entries(present).filter(([_, sc]) => sc >= thr).sort((a,b)=> b[1]-a[1]);
    const near = Object.entries(present).filter(([_, sc]) => sc < thr && sc >= Math.min(0.3, thr*0.6)).sort((a,b)=> b[1]-a[1]);
    const hasAny = over.length > 0;

    let html = '';
    if (hasAny) {
      html += `<p class="ok"><b>✔ Misión confirmada (MVP)</b>. Detectados (≥ ${(thr*100).toFixed(0)}%):</p>`;
      html += '<ul>' + over.map(([lab, sc]) => `<li>${lab}: ${(sc*100).toFixed(0)}%</li>`).join('') + '</ul>';
      if (near.length) {
        html += `<p class="muted">Casi en umbral:</p>`;
        html += '<ul>' + near.map(([lab, sc]) => `<li>${lab}: ${(sc*100).toFixed(0)}%</li>`).join('') + '</ul>';
      }
    } else if (near.length) {
      html += `<p class="warn"><b>⚠ Probablemente en progreso</b>. Hay indicios pero bajo el umbral:</p>`;
      html += '<ul>' + near.map(([lab, sc]) => `<li>${lab}: ${(sc*100).toFixed(0)}%</li>`).join('') + '</ul>';
    } else {
      html += `<p class="err"><b>✖ Misión no confirmada</b>. No se detectaron proxies suficientes.</p>`;
    }

    // Consejos breves
    const adv = AdviceList(missionId, Array.from(new Set([...over.map(x=>x[0]), ...near.map(x=>x[0])])));
    if (adv) html += `<ul>${adv}</ul>`;

    const ok = hasAny;
    onValidated({ ok, detailsHtml: html });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Sube hasta 3 fotos claras de tu proyecto. Validaremos materiales y herramientas comunes (proxies COCO).</p>
      {wantsValidation && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Materiales esperados:</span>
          <ul className="list-disc ml-5 mt-1">
            {expectedList.map((l, i) => (<li key={i}>{l}</li>))}
          </ul>
        </div>
      )}
      <input type="file" multiple accept="image/*" onChange={e=>onFilesChanged(e.target.files)} />
      {previewUrls.length > 0 && (
        <div className="flex gap-2">
          {previewUrls.map((url, i)=>(<img key={i} src={url} className="h-20 w-20 object-cover rounded border" />))}
        </div>
      )}
      <div className="text-xs text-muted-foreground">{status}</div>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" disabled={!ready} onClick={runValidation}>Validar</button>
        <button className="px-3 py-2 rounded border" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
