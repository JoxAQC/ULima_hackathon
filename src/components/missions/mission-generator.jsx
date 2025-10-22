import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';
// Importamos la base de conocimiento (BD) desde el archivo JSON
import knowledgeBase from './knowledgeBase.json';
// Documento base Perú para la introducción (offline)
// Nuevo dataset de fine-tuning (JSONL) como fuente principal de conocimiento
// Eliminado: JSONL de fine-tuning (ya no se usa)
// import energiaPeruInstruct from '../data/energia_peru_instruct.jsonl?raw';
// NUEVO: Texto base (Perú) para RAG
import energiaPeruTxtRaw from './energia_renovable_peru.txt?raw';

// Modelos soportados (orden de prioridad: más liviano garantizado primero)
const SUPPORTED_MODELS = [
  { id: 'Qwen2-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen2 0.5B (WebLLM)' },
  { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', name: 'TinyLlama 1.1B (WebLLM)' },
];

const App = () => {
  const [inputMateriales, setInputMateriales] = useState('');
  const [inputVivienda, setInputVivienda] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Preparando modelo…');
  const [respuesta, setRespuesta] = useState('');
  const [isModelReady, setIsModelReady] = useState(false);
  const [hasWebGPU, setHasWebGPU] = useState(false);
  const engineRef = useRef(null);
  const introCacheRef = useRef('');
  // Cache del TXT tokenizado en oraciones
  const txtSentencesRef = useRef(null);
  // Eliminado: cache del dataset JSONL
  // Nonce para rotar sutilmente los "Datos curiosos" entre envíos del usuario
  const factsNonceRef = useRef(0);
  const [currentModelName, setCurrentModelName] = useState(SUPPORTED_MODELS[0].name);
  // UI: pestañas (misión | chat)
  const [activeTab, setActiveTab] = useState('mision');
  // Estado de chat conversacional
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asistente sostenible. Pregúntame sobre energías renovables en Perú, tecnologías, pasos de implementación en casa, o dudas de las misiones. Respondo 100% offline usando un modelo local.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // (El formateador determinista original no se usa; se mantiene solo `formatMissionCard` como fallback principal)

  // Inicialización
  useEffect(() => {
    // Verificamos soporte de WebGPU
    const supported = typeof navigator !== 'undefined' && !!navigator.gpu;
    setHasWebGPU(supported);

    if (!supported) {
      setStatusText('⚠️ Tu navegador no soporta WebGPU. Prueba con Chrome/Edge actualizado o una GPU compatible.');
      return;
    }

    let isCancelled = false;

    const init = async () => {
      try {
  setStatusText('⏳ Buscando modelo local…');

        // Intentar cargar un modelo local (estricto offline), probando de mayor a menor
        let loaded = false;
        for (const m of SUPPORTED_MODELS) {
          if (isCancelled) return;
          // Usar SOLO la carpeta específica del modelo para evitar mezclar tokenizers/configs
          const candidateBaseUrls = [
            `/models/${m.id}/`,
          ];
          for (const baseUrl of candidateBaseUrls) {
            // Verificar presencia local de config
            let ok = false;
            try {
              const res = await fetch(`${baseUrl}mlc-chat-config.json`, { cache: 'no-store' });
              ok = res.ok;
            } catch {
              ok = false;
            }
            if (!ok) continue;

            setStatusText(`⏳ Encontrado: ${m.name}. Cargando…`);
            try {
              const base = webllm.prebuiltAppConfig || {};
              const entry = (base.model_list || []).find(x => x.model_id === m.id);
              const model_list = entry ? [{ ...entry, model_url: baseUrl }] : [
                { model_id: m.id, model_url: baseUrl }
              ];
              const appConfig = { ...base, model_list };

              const engine = await webllm.CreateMLCEngine(m.id, {
                appConfig,
                gpuMemoryUtilization: 0.55,
                initProgressCallback: (report) => {
                  if (isCancelled) return;
                  const pct = report.progress ? Math.round(report.progress * 100) : undefined;
                  const stage = report.text || 'Preparando…';
                  setStatusText(pct != null ? `⏳ ${stage} (${pct}%)` : `⏳ ${stage}`);
                },
              });

              if (isCancelled) return;
              engineRef.current = engine;
              setCurrentModelName(m.name);
              setIsModelReady(true);
              setStatusText(`✅ Modelo cargado: ${m.name}`);
              loaded = true;
              break;
            } catch (err) {
              console.warn(`Fallo al cargar ${m.id} desde ${baseUrl}, probando siguiente ruta…`, err);
            }
          }
          if (loaded) break;
        }

        if (!loaded) {
          setStatusText('❌ No se encontró ningún modelo local compatible en /public/models/.');
        }
      } catch (err) {
        console.error('Error inicializando WebLLM:', err);
        setStatusText('❌ Error al inicializar el modelo. Revisa consola.');
      }
    };

    init();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Utilidades de texto para el TXT de Perú
  const ensureTxtSentences = useCallback(() => {
    if (txtSentencesRef.current) return txtSentencesRef.current;
    const raw = (energiaPeruTxtRaw || '').toString();
    // Normalizamos saltos de línea y separamos por oraciones o viñetas
    const blocks = raw
      .replace(/\r/g, '')
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter(b => !b.startsWith('---') && !b.startsWith('Palabras clave:'));
    const sents = [];
    for (const b of blocks) {
      // Separar por líneas y por oración
      const lines = b.split(/\n+/).map(x => x.trim()).filter(Boolean);
      for (const ln of lines) {
        const isAllCaps = ln === ln.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(ln) && !/[a-záéíóúñ]/.test(ln);
        const isFuente = /^fuente\s*:/.test(ln.toLowerCase());
        const isSection = /^[0-9]+\.\s/.test(ln);
        if (isAllCaps || isFuente || isSection) continue;
        const parts = ln
          .split(/(?<=[.!?])\s+|\s*[-•]\s+/)
          .map(x => x.trim())
          .filter(Boolean);
        for (const p of parts) {
          // Filtrar títulos muy cortos
          const hasLower = /[a-záéíóúñ]/.test(p);
          const notFuente = !/^fuente\s*:/.test(p.toLowerCase());
          if (p.length >= 25 && hasLower && notFuente) sents.push(p);
        }
      }
    }
    // De-duplicar aproximado
    const seen = new Set();
    const uniq = [];
    for (const s of sents) {
      const key = s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, '').slice(0, 140);
      if (!seen.has(key)) { seen.add(key); uniq.push(s); }
    }
    txtSentencesRef.current = uniq;
    return uniq;
  }, []);

  // Introducción breve tomada del TXT (primeras 2 oraciones informativas)
  const getIntroFromTxt = useCallback(() => {
    if (introCacheRef.current) return introCacheRef.current;
    const sents = ensureTxtSentences();
    const intro = (sents || []).slice(0, 2).join(' ')
      || 'La energía renovable en el hogar reduce costos y emisiones, mejorando la salud y el confort.';
    introCacheRef.current = intro;
    return intro;
  }, [ensureTxtSentences]);

  // Eliminado: ensureInstructDataset (JSONL)

  // Clasifica dominio de la misión para guiar la selección de frases del TXT
  function detectMissionDomain(mission) {
    const title = (mission?.mision_titulo || '').toLowerCase();
    const tipo = (mission?.tipo_mision || '').toLowerCase();
    // Señales de solar pasiva (no fotovoltaica)
    const isBottleLamp = /botella|luz de botella|l[aá]mpara de botella/.test(title) || /iluminaci[óo]n pasiva/.test(tipo);
    if (isBottleLamp) return 'solar-pasiva';
    if (/fotovoltaic|panel|fv/.test(title + ' ' + tipo)) return 'solar-fv';
    if (/t[ée]rmic/.test(title + ' ' + tipo)) return 'solar-termica';
    if (/e[óo]lica|viento/.test(title + ' ' + tipo)) return 'eolica';
    if (/biomasa|cocci[óo]n|estufa|le[ñn]a/.test(title + ' ' + tipo)) return 'biomasa';
    if (/mini ?hidr|hidroel[ée]ctrica|r[íi]o/.test(title + ' ' + tipo)) return 'minihidraulica';
    return 'general';
  }

  // Extrae 1–2 oraciones relevantes desde el TXT según la misión y el usuario (sin JSONL)
  const getCuriousFacts = useCallback((mission, userCtx = {}) => {
    const sents = ensureTxtSentences();
    if (!sents || sents.length === 0) return '';
    const domain = detectMissionDomain(mission);
    const tipoBase = (mission?.tipo_mision || '').toLowerCase();
    const tituloBase = (mission?.mision_titulo || '').toLowerCase();
    const pushTokens = (s) => (s||'').toLowerCase().split(/[\s,;]+/).filter(w => w.length > 2);
    let kw = [
      ...pushTokens(tipoBase),
      ...pushTokens(tituloBase),
      ...pushTokens(userCtx.materiales),
      ...pushTokens(userCtx.vivienda)
    ];
    const joined = `${tipoBase} ${tituloBase}`;
    if (/solar|panel|fotovoltaic|t[ée]rmic|colector/.test(joined)) kw = kw.concat(['solar','fotovoltaico','panel']);
    if (/agua|ducha|calentar|termo/.test(joined)) kw = kw.concat(['agua','térmico','temperatura']);
    if (/iluminaci[óo]n|luz|luminosa|linterna/.test(joined)) kw = kw.concat(['iluminación','eléctrica']);
    if (/cocci[óo]n|estufa|horno|biomasa|leña|carb[óo]n/.test(joined)) kw = kw.concat(['biomasa','humo','eficiencia']);
    if (/e[óo]lica|viento|turbina/.test(joined)) kw = kw.concat(['eólica','viento']);
    if (/mini ?hidr|hidroel[ée]ctrica|r[ií]o|caudal/.test(joined)) kw = kw.concat(['hidroeléctrica','río','caudal']);

    // Reglas de exclusión según dominio para evitar frases off-topic (p.ej., FV para botella solar)
  const disallow = new RegExp(domain === 'solar-pasiva' ? '(panel|bater[ií]a|inversor|controlador|fotovoltaic|FV)' : '$^', 'i');
  const prefer = new RegExp(domain === 'solar-pasiva' ? '(iluminaci[óo]n|luz|solar|pasiva|d[ií]a|radiaci[óo]n|techo|rural)' : '', 'i');

  // Detectores de política/subastas y lista de tecnologías para penalizar frases muy generales
  const policyRe = /(decreto\s+legislativo|dl\s*1002|subastas?\s+rers?|pol[íi]ticas?\s+de\s+promoci[óo]n)/i;
  const techList = ['solar','eólica','minihidráulica','biomasa','geotérmica','marítima'];

    const scored = sents.map((st, i) => {
      const low = st.toLowerCase();
      let score = 0;
      if (disallow.test(low)) return { i, score: -9999 };
      // Evitar frases de política salvo en ocasiones aleatorias
      if (policyRe.test(low)) {
        const nonce = Number(userCtx.nonce || 0);
        const allowPolicy = (nonce % 7 === 0); // ~1 de cada 7
        if (!allowPolicy) return { i, score: -9999 };
        // Si se permite, bájala un poco para que no domine
        score -= 1;
      }
      // Penaliza frases que listan varias tecnologías si la misión no es general
      const techCount = techList.reduce((acc, t) => acc + (low.includes(t) ? 1 : 0), 0);
      if (domain !== 'general' && techCount >= 2) score -= 1.5;
      for (const t of kw) if (low.includes(t)) score += 1;
      if (prefer.source && prefer.test(low)) score += 0.75;
      if (/per[uú]|rer|renovable|co2|emisi/i.test(low)) score += 0.25;
        if (domain === 'solar-pasiva' && /(eólica|viento)/i.test(low)) score -= 1; // evita mezclar eólica en botella solar
      return { i, score };
    }).filter(x => x.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, 2)
      .map(x => sents[x.i]);
    if (scored.length === 0) return '';
    return scored.join(' ');
  }, [ensureTxtSentences]);

  // Recupera oraciones relevantes del NUEVO TXT según una consulta libre (para el chat)
  const getRelevantTxtSentences = useCallback((query, max = 5) => {
    const sents = ensureTxtSentences();
    if (!sents || sents.length === 0) return [];
    const q = (query || '').toLowerCase();
    const toks = q.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (toks.length === 0) return sents.slice(0, Math.min(3, sents.length));
    const policyRe = /(decreto\s+legislativo|dl\s*1002|subastas?\s+rers?|pol[íi]ticas?\s+de\s+promoci[óo]n)/i;
    const queryWantsPolicy = /(pol[íi]tica|subasta|dl\s*1002|decreto)/i.test(q);
    const techList = ['solar','eólica','minihidráulica','biomasa','geotérmica','marítima'];
    const scores = sents.map(st => {
      const low = st.toLowerCase();
      let score = 0;
      // Excluir frases de política si el usuario no las pidió
      if (!queryWantsPolicy && policyRe.test(low)) return -9999;
      for (const t of toks) if (low.includes(t)) score += 1;
      // Impulsos por tema
      if (/e[óo]lica|viento|aerogenerador|parque e[óo]lico|onshore|offshore/.test(q)) {
        if (/e[óo]lica|viento|aerogenerador|parque e[óo]lico|onshore|offshore/.test(low)) score += 3;
        if (/solar|fotovoltaic|t[ée]rmic/.test(low)) score -= 0.5; // desprioriza solar si pregunta por eólica
      }
      // Penaliza oraciones muy generales que listan muchas tecnologías si la consulta es específica
      const techCount = techList.reduce((acc, t) => acc + (low.includes(t) ? 1 : 0), 0);
      const isSpecific = /(e[óo]lica|solar|fotovoltaic|t[ée]rmica|biomasa|minihidr[aá]ulica|geot[ée]rmica|mar[íi]tima)/i.test(q);
      if (isSpecific && techCount >= 2) score -= 1.5;
      // pequeño impulso si menciona Perú o RER
      if (/per[uú]|rer|renovable|co2|emisi/i.test(low)) score += 0.25;
      return score;
    });
    const idx = scores.map((s, i) => [s, i]).filter(x => x[0] > 0).sort((a,b) => b[0] - a[0]).map(x => x[1]);
    const out = [];
    for (const i of idx) { out.push(sents[i]); if (out.length >= max) break; }
    return out.slice(0, max);
  }, [ensureTxtSentences]);

  // Recupera 1-2 misiones del JSON relevantes a una consulta libre
  const getRelevantKB = useCallback((query, max = 2) => {
    const q = (query || '').toLowerCase();
    const contains = (re) => new RegExp(re, 'i').test(q);
    const topicEolica = contains('e[oó]lica|viento|aerogenerador|parque e[oó]lico');
    const tokens = q.split(/[\s,;.]+/).filter(w => w.length > 2 && !/^(energ[ií]a|renovable|per[uú]|sobre|que|c[oó]mo|para)$/i.test(w));
    const items = knowledgeBase.filter(item => {
      const text = [item.mision_titulo, item.tipo_mision, item.instrucciones_basicas, (item.pasos||[]).join(' ')].join(' ').toLowerCase();
      if (topicEolica) return /e[oó]lic/.test(text) || /viento/.test(text); // si pide eólica, solo eólica
      return true;
    }).map(item => {
      const text = [item.mision_titulo, item.tipo_mision, item.instrucciones_basicas, (item.pasos||[]).join(' ')].join(' ').toLowerCase();
      let score = 0;
      for (const t of tokens) if (text.includes(t)) score += 1;
      return { item, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return items.slice(0, max).map(x => x.item);
  }, []);

  // Construye un prompt con contexto para el chat 
  const buildChatPrompt = useCallback((userInput, history = []) => {
    const recent = history.slice(-4).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
    const txtCtx = getRelevantTxtSentences(userInput, 4);
    const kbCtx = getRelevantKB(userInput, 3).map(m => {
      const desc = m.objetivo || m.enfasis_renovable || m.instrucciones_basicas || '';
      return `- ${m.mision_titulo}: ${desc}`.trim();
    });
    const topic = (/e[óo]lica|viento/i.test(userInput) ? 'energía eólica (viento)' : 'energías renovables');
    const ctx = [
      txtCtx.length ? `Contexto del TXT (Perú):\n${txtCtx.map(s => `• ${s}`).join('\n')}` : '',
      kbCtx.length ? `Misiones relacionadas:\n${kbCtx.join('\n')}` : ''
    ].filter(Boolean).join('\n\n');
    return [
      `Tema: ${topic}. Responde en 1 párrafo corto (2–3 frases) y, si aplica, añade hasta 3 viñetas prácticas. Sé directo, útil y concreto. No mezcles otras tecnologías si no fueron solicitadas. Prioriza el contexto del TXT.`,
      ctx ? `Contexto:\n${ctx}` : '',
      recent ? `Historial breve:\n${recent}` : '',
      `Pregunta del usuario: ${userInput}`
    ].filter(Boolean).join('\n\n');
  }, [getRelevantTxtSentences, getRelevantKB]);

  // Enviar mensaje al chat
  const handleChatSend = useCallback(async (e) => {
    e?.preventDefault?.();
    if (isChatLoading || !chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, userMsg];
    // Insertar respuesta del asistente como placeholder para actualizar en streaming
    const assistantIdx = newHistory.length; // índice donde irá el asistente
    setChatMessages([...newHistory, { role: 'assistant', content: '' }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const lowerQ = userMsg.content.toLowerCase();
      const queryWantsPolicy = /(pol[íi]tica|subasta|dl\s*1002|decreto)/i.test(lowerQ);
      const txtCtxAll = getRelevantTxtSentences(userMsg.content, 5);
      // Usar hasta 2 citas del TXT como base del contexto
      const quotes = txtCtxAll.slice(0, 2);

      if (hasWebGPU && engineRef.current) {
        // Construir prompt: el modelo SOLO debe escribir UNA oración adicional; las citas del TXT las insertamos nosotros.
        const policyRule = queryWantsPolicy ? '' : 'No hables de políticas, subastas RER ni DL 1002 salvo que te lo pidan explícitamente.';
        const system = 'Eres un asistente en español latino, conciso y útil. No inventes cifras ni fuentes. No uses corchetes ni plantillas. Devuelve únicamente UNA oración breve y clara.';
        const user = [
          `Pregunta: ${userMsg.content}`,
          quotes.length ? `Referencia (citas del TXT, NO repetir ni parafrasear):\n${quotes.map(s => `- ${s}`).join('\n')}` : 'Referencia: (sin coincidencias claras en TXT)'
        ].join('\n\n');
        const rules = [
          'Instrucciones:',
          '- Escribe SOLO UNA oración adicional (máx. 20 palabras).',
          '- No repitas las citas, no escribas comillas, no enumeres, no agregues títulos.',
          '- No cambies de tema. ' + policyRule,
        ].join(' ');

        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: `${user}\n\n${rules}` }
        ];

        setStatusText('💬 Pensando…');
        let extra = '';
        try {
          const resp = await engineRef.current.chat.completions.create({
            messages,
            temperature: 0.1,
            max_tokens: 60,
          });
          extra = resp?.choices?.[0]?.message?.content ?? '';
        } catch (err) {
          console.warn('Fallo de LLM en chat; uso fallback TXT:', err);
        }

        let extraClean = sanitizePartialChat(extra)
          .replace(/formato de salida.*$/i, '')
          .replace(/instrucciones.*$/i, '')
          .replace(/^\d+\)\s*/, '')
          .trim();
        // Dejar solo la primera oración
        extraClean = (extraClean.split(/(?<=[.!?])\s+/)[0] || '').trim();
        if (extraClean && !/[.!?]$/.test(extraClean)) extraClean += '.';

        const base = quotes.length ? `"${quotes.join('" "')}"` : buildFallbackFromTxt(userMsg.content);
        const finalOut = extraClean ? `${base} ${extraClean}` : base;

        setChatMessages(prev => {
          const next = [...prev];
          next[assistantIdx] = { role: 'assistant', content: finalOut };
          return next;
        });
        setStatusText('✅ Respuesta lista.');
        return;
      }

      // Si no hay modelo disponible, responde con las frases del TXT (RAG estricto)
      if (txtCtxAll.length > 0) {
        const answer = txtCtxAll.slice(0, 2).join(' ');
        setChatMessages(prev => {
          const next = [...prev];
          next[assistantIdx] = { role: 'assistant', content: answer };
          return next;
        });
        setStatusText('✅ Respuesta lista (TXT).');
        return;
      }

      // Sin contexto suficiente: fallback breve
      const fallback = buildFallbackFromTxt(userMsg.content);
      setChatMessages(prev => {
        const next = [...prev];
        next[assistantIdx] = { role: 'assistant', content: fallback };
        return next;
      });
      setStatusText('ℹ️ Sin contexto suficiente en TXT.');
    } catch (err) {
      console.error('Error en chat:', err);
      // En caso de error, intentar un fallback breve desde el TXT
      const fallback = buildFallbackFromTxt(chatInput);
      setChatMessages(prev => {
        const next = [...prev];
        const idx = next.length - 1;
        if (idx >= 0 && next[idx].role === 'assistant') {
          next[idx] = { role: 'assistant', content: fallback };
          return next;
        }
        return [...prev, { role: 'assistant', content: fallback }];
      });
      setStatusText('❌ Error en el chat.');
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, chatMessages, getRelevantTxtSentences, hasWebGPU, isChatLoading]);

  // Similaridad de Jaccard basada en tokens para evitar duplicados casi idénticos
  function similarity(a, b) {
    const A = new Set(a.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
    const B = new Set(b.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
    const inter = new Set([...A].filter(x => B.has(x)));
    const union = new Set([...A, ...B]);
    return inter.size / (union.size || 1);
  }

  // Post-procesamiento del chat en streaming
  function sanitizePartialChat(text) {
    if (!text) return '';
    const cleaned = text.replace(/\[.*?\]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    // Evita cortar mitad de palabra: recorta hasta el último punto si es muy largo
    if (cleaned.length > 260) {
      const lastDot = cleaned.lastIndexOf('.');
      if (lastDot > 120) return cleaned.slice(0, lastDot + 1);
      return cleaned.slice(0, 240).trim();
    }
    return cleaned;
  }

  function finalizeChatAnswer(text, userQ) {
    let cleaned = sanitizePartialChat(text);
    // Limita a 2–3 frases
    const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    cleaned = parts.slice(0, 3).join(' ');
    // Si quedó muy corto o vacío, usar fallback del TXT
    if (!cleaned || cleaned.length < 40) {
      return buildFallbackFromTxt(userQ);
    }
    // Asegurar punto final
    if (!/[.!?]$/.test(cleaned)) cleaned += '.';
    return cleaned;
  }

  function buildFallbackFromTxt(userQ) {
    const ctx = getRelevantTxtSentences(userQ || '', 2);
    if (ctx.length) return ctx.slice(0,2).join(' ');
    // fallback genérico breve
    return 'La energía renovable reduce emisiones y costos en el hogar. Elige tecnologías según recursos locales y seguridad.';
  }

  // LÓGICA RAG: Recuperación de la Misión Relevante
  const findRelevantMission = useCallback(() => {
    if (!inputMateriales && !inputVivienda) return null;

    const materialesLower = inputMateriales.toLowerCase();
    const viviendaLower = inputVivienda.toLowerCase();

    let bestMatch = null;
    let maxMatches = 0;

    knowledgeBase.forEach(item => {
      let currentMatches = 0;

      // Ponderar por palabras clave de materiales
      const materialWords = materialesLower.split(/[\s,]+/).filter(w => w.length > 2);
      materialWords.forEach(word => {
          if (item.materiales_clave.toLowerCase().includes(word)) {
              currentMatches += 1;
          }
      });

      // Ponderar por tipo de vivienda
      if (item.vivienda.toLowerCase().includes(viviendaLower)) {
          currentMatches += 3; 
      }

      if (currentMatches > maxMatches) {
        maxMatches = currentMatches;
        bestMatch = item;
      }
    });
    return bestMatch;
  }, [inputMateriales, inputVivienda]);

  // Generación Aumentada y Llamada al LLM
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setRespuesta('');
    setStatusText('🧠 Generando recomendación con el LLM…');
    // Rotar nonce para variar la selección de frases entre envíos
    factsNonceRef.current = (factsNonceRef.current || 0) + 1;
    const relevantMission = findRelevantMission();

    // Crear el Prompt Aumentado (RAG: Inyectar contexto) con formato: título + beneficio + Datos curiosos (1 párrafo) + Pasos
    let prompt;
    // Preparamos intro para sanitización posterior
    const introSnippetAll = getIntroFromTxt();
    if (relevantMission) {
      const introSnippet = introSnippetAll;
      const co2Txt = String(relevantMission.ahorro_co2_estimado || '').replace(/\\text{CO}_2\$/g, 'CO2');
      const pasosSugeridos = Array.isArray(relevantMission.pasos) ? relevantMission.pasos.map((p, i) => `Paso ${i+1}: ${p}`).join("\n") : '';
      const datosCuriososCtx = getCuriousFacts(relevantMission, { materiales: inputMateriales, vivienda: inputVivienda, nonce: factsNonceRef.current });
  // Contexto adicional desde el TXT, según título/tipo
      const dsQuery = `${relevantMission.mision_titulo} ${relevantMission.tipo_mision}`;
      const dsCtx = getRelevantTxtSentences(dsQuery, 4).map(s => `• ${s}`).join('\n');
      prompt = `
        Usuario: materiales=${inputMateriales}; vivienda=${inputVivienda}.
        Responde EXACTAMENTE con este formato MUY conciso (≤ 8 líneas), sin texto adicional, sin corchetes []:
        Título: <texto breve>
        Beneficio: <1 línea (máx. 12–16 palabras)>
        Datos curiosos base Perú (resumen multi-oración):
        ${datosCuriososCtx}
        Datos curiosos: <un solo párrafo (2 frases) sobre la tecnología/impacto>
        Pasos:
        1) <1 línea, usando materiales del usuario y adaptado a su vivienda>
        2) <1 línea, construcción/montaje con medidas simples>
        3) <1 línea, prueba/seguridad o mejora>
        Reglas: español latino; 1 línea por paso; máximo 3 pasos; un solo párrafo para "Datos curiosos" (2 frases); no uses corchetes []; no repitas el formato.
        ✅ Misión Completada

        --- CONTEXTO RAG ---
        Título: ${relevantMission.mision_titulo}
        Instrucciones: ${relevantMission.instrucciones_basicas}
        Beneficios: ${relevantMission.enfasis_renovable}
        Ahorro Dinero: ${relevantMission.ahorro_dinero_estimado}
        CO2: ${co2Txt}
        Pasos sugeridos (del JSON):
        ${pasosSugeridos}
        --- CONTEXTO TXT (PERÚ, OFFLINE) ---
        ${introSnippet}
        ${dsCtx ? `\nMás contexto:\n${dsCtx}` : ''}
        --- FIN CONTEXTO ---

        Reglas: español latino; 1–2 líneas por paso; un solo párrafo para "Datos curiosos"; no uses corchetes []; no repitas las instrucciones ni el formato.
      `;
    } else {
      const introSnippet = getIntroFromTxt();
      prompt = `No se encontró misión. Responde en una sola línea: por qué la energía renovable en el hogar importa + pregunta si desea cocinar, calentar agua o iluminar. Base Perú: ${introSnippet}`;
    }

    try {
      if (!hasWebGPU) {
        setRespuesta('Tu navegador no soporta WebGPU, que es necesario para ejecutar el modelo 100% offline en el navegador. Intenta con la última versión de Chrome o Edge en Windows, o instala una GPU compatible.');
        setStatusText('⚠️ Sin WebGPU.');
        return;
      }

      if (!engineRef.current) {
        setRespuesta('El modelo aún no está listo. Espera a que termine de cargar y vuelve a intentar.');
        setStatusText('⏳ Cargando modelo…');
        return;
      }

      const engine = engineRef.current;

      // Construimos mensajes estilo Chat
      const messages = [
        { role: 'system', content: 'Eres un asistente experto en sostenibilidad, claro, conciso y práctico. Responde en español latino, tono amable. No uses corchetes ni plantillas literales. Entrega solo el contenido final.' },
        { role: 'user', content: prompt.trim() },
      ];

      setStatusText('💬 Pensando…');
      let accum = '';
      const chunks = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.25,
        max_tokens: 200,
      });

      for await (const chunk of chunks) {
        const delta = chunk?.choices?.[0]?.delta?.content ?? '';
        if (delta) { accum += delta; }
      }

      // Sanitiza el resultado para evitar placeholders o múltiples "Datos curiosos"
      const cleaned = sanitizeMissionCard(accum, relevantMission, inputMateriales, inputVivienda, introSnippetAll);
      setRespuesta(cleaned);
      setStatusText('✅ Recomendación lista.');
    } catch (error) {
      console.error("Error al generar texto:", error);
      // Si se perdió el dispositivo, sugiere recargar o usar modelo más ligero
      const lowerMsg = String(error?.message || error).toLowerCase();
      if (lowerMsg.includes('device was lost') || lowerMsg.includes('gpudevicelost') || lowerMsg.includes('instance dropped')) {
        setStatusText('⚠️ La GPU se perdió. Intenta recargar o usar el modelo más ligero (TinyLlama).');
      } else {
        setStatusText('❌ Error en la generación.');
      }
      const relevantMission = findRelevantMission();
      const intro = getIntroFromTxt();
      setRespuesta(formatMissionCard(relevantMission, inputMateriales, inputVivienda, intro));
    } finally {
      setIsLoading(false);
    }
  };

  // Tarjeta de misión concisa (fallback determinista)
  const formatMissionCard = useCallback((mission, materiales, vivienda, intro) => {
    if (!mission) {
      const brief = intro ? `Intro: ${intro}` : 'La energía renovable reduce costos y emisiones en el hogar.';
      return `${brief} ¿Deseas enfocarte en cocinar, calentar agua o iluminar?`;
    }
    const title = mission.mision_titulo || 'Misión de Ahorro Sostenible';
    const oneLiner = mission.enfasis_renovable || 'Aprovecha energía limpia para reducir costos y CO2.';
    const steps = (Array.isArray(mission.pasos) && mission.pasos.length > 0)
      ? mission.pasos
  : (mission.instrucciones_basicas || '').split(/[•\n;.]+/).map(s => s.trim()).filter(Boolean);
    const materialesTxt = (materiales || '').trim() || 'tus materiales';
    const viviendaTxt = (vivienda || '').trim() || 'tu vivienda';
  const datoCurioso = getCuriousFacts(mission, { materiales, vivienda, nonce: factsNonceRef.current }) || (intro?.split('.')?.slice(0,2).join('. ') || 'Esta solución reduce costos y emisiones en el hogar.');
    const s1 = steps[0] || `Selecciona ${materialesTxt} útiles y prepara un área segura en ${viviendaTxt}.`;
    const s2 = steps[1] || `Arma la estructura con medidas simples usando ${materialesTxt}; fija para evitar caídas.`;
    const s3 = steps[2] || `Haz una prueba breve; verifica fugas/estabilidad y ajusta según ${viviendaTxt}.`;
    return (
      `${title}\n` +
      `${oneLiner}\n\n` +
      `Datos curiosos: ${datoCurioso}\n\n` +
      `Pasos:\n` +
      `Paso 1: ${s1}\n` +
      `Paso 2: ${s2}\n` +
      `Paso 3: ${s3}\n` +
      `\n✅ Misión Completada`
    );
  }, [getCuriousFacts]);

  // Construye un párrafo breve de "Datos curiosos" si falta o el modelo falló
  const buildDatosCuriosos = useCallback((mission, intro) => {
    if (!mission) return intro?.split('.')?.[0] || 'Esta solución reduce costos y emisiones en el hogar.';
    const base = mission.enfasis_renovable || mission.tipo_mision || 'Solución renovable útil en el hogar';
    const co2 = typeof mission.ahorro_co2_estimado === 'string' ? mission.ahorro_co2_estimado.replace(/\s+/g, ' ').trim() : '';
    const introLine = (intro || '').split('.')?.[0] || '';
    const parts = [base, co2, introLine].filter(Boolean);
    const text = parts.join('. ');
    return text.endsWith('.') ? text : `${text}.`;
  }, []);

  // Sanitiza la respuesta del modelo: evita placeholders, asegura formato y único párrafo de Datos curiosos
  const sanitizeMissionCard = useCallback((raw, mission, materiales, vivienda, intro) => {
    const hasPlaceholders = /\[.*?\]/.test(raw) || /párrafo breve/i.test(raw) || /<[^>]+>/.test(raw);
    const tooManyDatos = (raw.match(/Datos curiosos:/gi) || []).length > 1;
    const missingDatos = !/Datos curiosos:/i.test(raw);
    const missingPasos = !/Pasos:/i.test(raw);
    const domain = detectMissionDomain(mission);

    if (hasPlaceholders || tooManyDatos || missingPasos) {
      // Reemplazar completamente con tarjeta determinista en formato pedido
      return formatMissionCard(mission, materiales, vivienda, intro);
    }

    if (missingDatos) {
      // Insertar bloque de Datos curiosos antes de Pasos
  const curioso = getCuriousFacts(mission, { materiales, vivienda, nonce: factsNonceRef.current }) || buildDatosCuriosos(mission, intro);
      return raw.replace(/Pasos:/i, `Datos curiosos: ${curioso}\n\nPasos:`);
    }

    // Si el modelo mencionó componentes FV en una misión de solar pasiva, sustituir por curiosos filtrados
    if (domain === 'solar-pasiva' && /(panel|bater[ií]a|inversor|controlador|fotovoltaic|FV)/i.test(raw)) {
      const curioso = getCuriousFacts(mission, { materiales, vivienda, nonce: factsNonceRef.current }) || buildDatosCuriosos(mission, intro);
      return raw.replace(/Datos curiosos:[\s\S]*?(?=\n\nPasos:|$)/i, `Datos curiosos: ${curioso}`);
    }

    return raw;
  }, [buildDatosCuriosos, formatMissionCard, getCuriousFacts]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex justify-center items-start">
      {/* Contenedor principal simulando el marco de una App Móvil */}
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden">
        
        {/* Encabezado */}
        <header className="p-5 bg-emerald-700 text-white shadow-lg">
          <h1 className="text-2xl font-extrabold text-center">
            🌱 Eco-Asistente <span className="text-emerald-300">Offline</span>
          </h1>
          <p className="text-sm text-center mt-1 text-emerald-100">
            Modelo: {currentModelName} — 100% en tu navegador con WebGPU.
          </p>
        </header>

        {/* Estado del Modelo */}
        <div className={`p-3 text-center text-sm font-medium ${isModelReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {statusText}
        </div>

        {/* Navegación de pestañas */}
        <div className="px-5 pt-4 flex gap-2 border-b">
          <button onClick={() => setActiveTab('mision')} className={`px-3 py-2 rounded-t-lg text-sm font-semibold ${activeTab==='mision' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:text-emerald-700'}`}>Misiones</button>
          <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 rounded-t-lg text-sm font-semibold ${activeTab==='chat' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:text-emerald-700'}`}>Chat</button>
        </div>

        {/* Formulario de Entrada - pestaña Misiones */}
        {activeTab === 'mision' && (
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div>
            <label htmlFor="materiales" className="block text-sm font-semibold text-gray-700 mb-2">
              Tengo disponible (materiales clave):
            </label>
            <input
              id="materiales"
              type="text"
              value={inputMateriales}
              onChange={(e) => setInputMateriales(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
              placeholder="Ej: leña, pila, caja de cartón"
              required
            />
          </div>

          <div>
            <label htmlFor="vivienda" className="block text-sm font-semibold text-gray-700 mb-2">
              Mi tipo de vivienda es:
            </label>
            <input
              id="vivienda"
              type="text"
              value={inputVivienda}
              onChange={(e) => setInputVivienda(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
              placeholder="Ej: casa, apartamento, rancho"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold text-white transition duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? 'Generando Misión...' : '🚀 Recomendar Misión de Ahorro'}
          </button>
        </form>
        )}

        {/* Pestaña Chat conversacional */}
        {activeTab === 'chat' && (
          <div className="p-5 space-y-4">
            <div className="h-64 overflow-auto bg-emerald-50 rounded-xl p-3 text-sm text-gray-800 shadow-inner">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`mb-3 ${m.role==='user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${m.role==='user' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-800 border'}`}>{m.content}</div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Pensando…</span>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSend} className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Escribe tu pregunta…"
                value={chatInput}
                onChange={(e)=>setChatInput(e.target.value)}
                disabled={isChatLoading}
                required
              />
              <button type="submit" disabled={isChatLoading} className={`px-4 py-3 rounded-lg font-bold text-white ${isChatLoading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Enviar</button>
            </form>
          </div>
        )}

  {/* Animación de espera mientras "piensa" (solo Misiones) */}
  {activeTab==='mision' && isLoading && (
          <div className="p-5 pt-0">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Pensando…</span>
            </div>
            <div className="mt-3 bg-emerald-50 h-24 rounded-xl animate-pulse" />
          </div>
        )}

  {/* Área de Respuesta del Asistente (solo Misiones) */}
  {activeTab==='mision' && respuesta && !isLoading && (
          <div className="p-5 pt-0">
            <h3 className="text-xl font-bold text-emerald-700 mb-3 border-t pt-4">
              Mensaje del Asistente
            </h3>
            <div className="bg-emerald-50 p-4 rounded-xl shadow-inner text-gray-800 whitespace-pre-wrap">
              {respuesta}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default App;