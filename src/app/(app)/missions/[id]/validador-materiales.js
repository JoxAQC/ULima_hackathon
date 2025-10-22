import { FilesetResolver, ImageClassifier, ObjectDetector } from '@mediapipe/tasks-vision';

const el = (id) => document.getElementById(id);
const state = {
  files: [],
  mission: 'horno_solar',
  loaded: false,
  engines: {},
  labels: {},
  configs: {},
  baseUrl: '/'
};

// MVP con COCO SSD MobileNet (modelo genérico de 80 clases)
// Usamos clases proxy para validar "al menos un material/herramienta" presente.
const CONFIGS = {
  horno_solar: {
    type: 'object_detection',
    mode: 'mvp_coco',
    modelPath: '/models/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/2.tflite',
    // labelmap.txt existe, pero ObjectDetector retorna categoryName; no necesitamos leerlo.
    // Clases proxy útiles en COCO
    expected: ['bottle','cup','knife','scissors','cell phone','backpack','refrigerator','tv'],
    thresholds: { default: 0.5 }
  },
  luz_botella: {
    type: 'object_detection',
    mode: 'mvp_coco',
    modelPath: '/models/coco_ssd_mobilenet_v1_1.0_quant_2018_06_29/2.tflite',
    // Añadimos proxies genéricos de herramientas para capturar tijeras/cuchillo si aparecen en la escena
    expected: ['bottle','cup','sink','scissors','knife','cell phone'],
    thresholds: { default: 0.5 }
  }
};

async function prepareVision() {
  try {
    // Los archivos WASM están en /public/mediapipe/wasm tras vision:prepare
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    state.fileset = fileset;
    state.loaded = true;
    el('status').textContent = 'Listo: recursos de visión cargados (offline).';
    el('btnRun').disabled = false;
  } catch (e) {
    console.error(e);
    el('status').textContent = 'Error cargando recursos de visión. Ejecuta "npm run vision:prepare" y recarga.';
  }
}

async function getEngine(mission) {
  if (state.engines[mission]) return state.engines[mission];
  const cfg = CONFIGS[mission];
  if (!cfg) throw new Error('Config no encontrada para la misión');

  if (cfg.type === 'image_classification') {
    const classifier = await ImageClassifier.createFromOptions(state.fileset, {
      baseOptions: { modelAssetPath: cfg.modelPath },
      runningMode: 'IMAGE',
      maxResults: 5
    });
    state.engines[mission] = { kind: 'cls', inst: classifier, cfg };
  } else {
    try {
      // Resolver modelo: intentamos 2.tflite (preferido), luego detect_meta.tflite y detect.tflite
      const baseDir = cfg.modelPath.slice(0, cfg.modelPath.lastIndexOf('/'));
      const candidates = [
        cfg.modelPath,
        `${baseDir}/detect_meta.tflite`,
        `${baseDir}/detect.tflite`
      ];
      let chosenPath = '';
      for (const p of candidates) {
        try {
          const r = await fetch(p, { cache: 'no-store' });
          if (r.ok) { chosenPath = p; break; }
        } catch {}
      }
      if (!chosenPath) {
        el('status').innerHTML = `⚠️ No encuentro ningún modelo en:<br/>- <code>${candidates.join('</code><br/>- <code>')}</code><br/>Sube <code>2.tflite</code> (con metadata) a la carpeta y recarga.`;
        throw new Error('Modelo con metadata no disponible');
      }
      const detector = await ObjectDetector.createFromOptions(state.fileset, {
        baseOptions: { modelAssetPath: chosenPath },
        runningMode: 'IMAGE',
        scoreThreshold: 0.25,
        maxResults: 10
      });
      state.engines[mission] = { kind: 'det', inst: detector, cfg: { ...cfg, modelPath: chosenPath } };
    } catch (err) {
      const msg = String(err?.message || err);
      if (/metadata/i.test(msg)) {
        el('status').innerHTML = '⚠️ El modelo TFLite cargado no tiene Metadata requerida. Usa tu <code>2.tflite</code> con metadata o genera <code>detect_meta.tflite</code> y recarga.';
      }
      throw err;
    }
  }
  return state.engines[mission];
}

function renderPreview(files) {
  const row = el('previewRow');
  row.innerHTML = '';
  for (const f of files.slice(0,3)) {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.className = 'thumb';
    img.src = url;
    row.appendChild(img);
  }
}

function accumScore(obj, key, val) {
  obj[key] = Math.max(obj[key] || 0, val);
}

function scoreDetection(detRes, expected, thresholds, mode) {
  const present = {};
  const presentAll = {};
  for (const det of detRes.detections || []) {
    const cat = det.categories?.[0];
    if (!cat) continue;
    const name = (cat.categoryName || '').toLowerCase();
    const score = cat.score || 0;
    // Acumula para esperados
    if (expected.includes(name)) accumScore(present, name, score);
    // Acumula todo para fines informativos
    accumScore(presentAll, name, score);
  }
  // Modo MVP: confirmar si hay al menos un esperado por encima del umbral
  if (mode === 'mvp_coco') {
    const thr = thresholds?.default ?? 0.6;
    const overThr = Object.entries(present)
      .filter(([_, sc]) => sc >= thr)
      .sort((a,b)=> b[1]-a[1])
      .map(([label, sc]) => ({ label, score: sc }));
    const nearThr = Object.entries(present)
      .filter(([_, sc]) => sc < thr && sc >= Math.min(0.3, thr*0.6))
      .sort((a,b)=> b[1]-a[1])
      .map(([label, sc]) => ({ label, score: sc }));
    const hasAny = overThr.length > 0;
    const maxLabel = overThr[0]?.label || Object.keys(present)[0] || '';
    const maxScore = overThr[0]?.score || (maxLabel ? (present[maxLabel]||0) : 0);
    const progress = !hasAny && nearThr.length > 0;
    return { present, presentAll, overThr, nearThr, missing: [], confidence: maxScore, hasAny, progress, top: {label: maxLabel, score: maxScore, required: thr} };
  }
  // Modo detallado (multi-objetivo)
  const missing = [];
  let sum = 0;
  for (const label of expected) {
    const th = thresholds?.[label] ?? thresholds?.default ?? 0.5;
    const sc = present[label] || 0;
    sum += Math.min(1, sc / th);
    if (sc < th) missing.push({ label, score: sc, required: th });
  }
  const confidence = expected.length ? (sum / expected.length) : 0;
  return { present, missing, confidence };
}

function scoreClassification(clsRes, expected, thresholds) {
  const cats = clsRes.classifications?.[0]?.categories || [];
  const present = {};
  for (const c of cats) {
    const name = (c.categoryName || '').toLowerCase();
    const score = c.score || 0;
    if (expected.includes(name)) accumScore(present, name, score);
  }
  const missing = [];
  let sum = 0;
  for (const label of expected) {
    const th = thresholds?.[label] ?? 0.5;
    const sc = present[label] || 0;
    sum += Math.min(1, sc / th);
    if (sc < th) missing.push({ label, score: sc, required: th });
  }
  const confidence = expected.length ? (sum / expected.length) : 0;
  return { present, missing, confidence };
}

function adviceFor(mission, missing) {
  if (mission === 'horno_solar') {
    const map = {
      caja_carton: 'Refuerza y arma la caja como base del horno.',
      papel_aluminio: 'Forra el interior con el aluminio brillante hacia adentro.',
      tapa_transparente: 'Añade tapa de vidrio/acetato para efecto invernadero.',
      olla_oscura: 'Usa una olla oscura con tapa para absorber calor.'
    };
    return missing.map(m => `Falta/insuficiente "${m.label}": ${map[m.label] || ''}`);
  }
  if (mission === 'luz_botella') {
    const map = {
      botella_pet: 'Asegura una botella PET transparente llena.',
      agua: 'Llena con agua + 2–3 gotas de cloro/litro para claridad.',
      sellado_techo: 'Sella el orificio con silicona para evitar filtraciones.'
    };
    return missing.map(m => `Falta/insuficiente "${m.label}": ${map[m.label] || ''}`);
  }
  return missing.map(m => `Falta/insuficiente "${m.label}"`);
}

async function runValidation() {
  const files = state.files.slice(0,3);
  if (!files.length) return;
  el('result').innerHTML = 'Procesando…';
  const engine = await getEngine(state.mission);

  const scores = [];
  for (const f of files) {
    const img = await createImageBitmap(f);
    if (engine.kind === 'det') {
      const res = await engine.inst.detect(img);
      scores.push(scoreDetection(res, engine.cfg.expected, engine.cfg.thresholds, engine.cfg.mode));
    } else {
      const res = await engine.inst.classify(img);
      scores.push(scoreClassification(res, engine.cfg.expected, engine.cfg.thresholds));
    }
  }

  // Agregar y normalizar
  const present = {};
  const needed = new Set(engine.cfg.expected);
  let conf = 0;
  for (const s of scores) {
    for (const k of Object.keys(s.present)) accumScore(present, k, s.present[k]);
    conf += s.confidence;
  }
  conf = conf / scores.length;

  // Modo MVP: confirmar si hay al menos un proxy por encima del umbral (y listar múltiples)
  if (engine.cfg.mode === 'mvp_coco') {
    const thr = engine.cfg.thresholds?.default ?? 0.6;
    const over = Object.entries(present)
      .filter(([_, sc]) => sc >= thr)
      .sort((a,b)=> b[1]-a[1]);
    const near = Object.entries(present)
      .filter(([_, sc]) => sc < thr && sc >= Math.min(0.3, thr*0.6))
      .sort((a,b)=> b[1]-a[1]);
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
      html += `<p class="err"><b>✖ Misión no terminada</b>. No se detectaron proxies suficientes.</p>`;
    }
    el('result').innerHTML = html;
    return;
  }

  // Render detallado (multi-objetivo)
  const missing = [];
  for (const label of engine.cfg.expected) {
    const th = engine.cfg.thresholds?.[label] ?? 0.5;
    const sc = present[label] || 0;
    if (sc < th) missing.push({ label, score: sc, required: th });
  }
  const ok = missing.length === 0;
  const msg = ok ? `<p class="ok"><b>✔ Estructura correcta</b>. Confianza ${(conf*100).toFixed(0)}%.</p>`
                 : `<p class="warn"><b>⚠ Validación parcial</b>. Confianza ${(conf*100).toFixed(0)}%. Revisa:</p>`;
  const adv = adviceFor(state.mission, missing).map(s=>`<li>${s}</li>`).join('');
  el('result').innerHTML = `${msg}${missing.length ? `<ul>${adv}</ul>` : ''}`;
}

// Wire UI
el('missionSelect').addEventListener('change', (e)=>{
  state.mission = e.target.value;
});

el('fileInput').addEventListener('change', (e)=>{
  const files = Array.from(e.target.files || []).filter(f=>f.type.startsWith('image/'));
  state.files = files.slice(0,3);
  renderPreview(state.files);
});

el('btnRun').addEventListener('click', ()=>{
  runValidation();
});

prepareVision();
