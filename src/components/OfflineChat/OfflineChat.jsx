'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';
import knowledgeBase from '../../../generador-misiones-chatbot/src/knowledgeBase.json';

/**
 * OfflineChat.jsx
 * - Inicializa WebLLM si hay WebGPU y modelos en /public/models/{modelId}/
 * - Streaming de respuestas cuando hay modelo
 * - Fallback RAG (recuperación desde TXT + knowledgeBase) cuando NO hay modelo
 * - Lee el TXT desde /public/data/energia_renovable_peru.txt
 */

export default function OfflineChat() {
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asistente sostenible. Pregúntame sobre energías renovables en Perú; respondo offline usando la base local.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [statusText, setStatusText] = useState('Preparando modelo…');
  const [isModelReady, setIsModelReady] = useState(false);
  const [hasWebGPU, setHasWebGPU] = useState(false);
  const engineRef = useRef(null);
  const txtSentencesRef = useRef(null);

  const SUPPORTED_MODELS = [
    { id: 'Qwen2-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen2 0.5B (WebLLM)' },
    { id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', name: 'TinyLlama 1.1B (WebLLM)' },
  ];

  // Inicialización del motor (intenta cargar modelos locales en /public/models/{id}/)
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && !!navigator.gpu;
    setHasWebGPU(supported);
    if (!supported) {
      setStatusText('⚠️ Tu navegador no soporta WebGPU. El chat completo offline no funcionará.');
      return;
    }

    let cancelled = false;
    const init = async () => {
      setStatusText('⏳ Buscando modelo local…');
      let loaded = false;
      for (const m of SUPPORTED_MODELS) {
        if (cancelled) return;
        const baseUrl = `/models/${m.id}/`;
        // Verificar existencia de mlc-chat-config.json como heurística
        try {
          const resCheck = await fetch(`${baseUrl}mlc-chat-config.json`, { cache: 'no-store' });
          if (!resCheck.ok) continue;
        } catch (e) {
          continue;
        }

        try {
          setStatusText(`⏳ Cargando modelo ${m.name}…`);
          const base = webllm.prebuiltAppConfig || {};
          const entry = (base.model_list || []).find(x => x.model_id === m.id);
          const model_list = entry ? [{ ...entry, model_url: baseUrl }] : [{ model_id: m.id, model_url: baseUrl }];
          const appConfig = { ...base, model_list };
          const engine = await webllm.CreateMLCEngine(m.id, {
            appConfig,
            gpuMemoryUtilization: 0.55,
            initProgressCallback: (report) => {
              if (cancelled) return;
              const pct = report.progress ? Math.round(report.progress * 100) : undefined;
              const stage = report.text || 'Preparando…';
              setStatusText(pct != null ? `⏳ ${stage} (${pct}%)` : `⏳ ${stage}`);
            }
          });
          if (cancelled) return;
          engineRef.current = engine;
          setIsModelReady(true);
          setStatusText(`✅ Modelo cargado: ${m.name}`);
          loaded = true;
          break;
        } catch (err) {
          console.warn('Fallo al cargar modelo', m.id, err);
        }
      }
      if (!loaded) {
        setStatusText('⚠️ No se encontró modelo local en /public/models/ — el chat usará recuperación RAG sin LLM offline.');
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Cargar TXT (RAG) desde /public/data/energia_renovable_peru.txt
  useEffect(() => {
    let cancelled = false;
    async function loadTxt() {
      try {
        const res = await fetch('/data/energia_renovable_peru.txt');
        if (!res.ok) return;
        const raw = await res.text();
        if (cancelled) return;
        const blocks = raw.replace(/\r/g, '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
        const sents = [];
        for (const b of blocks) {
          const lines = b.split(/\n+/).map(x => x.trim()).filter(Boolean);
          for (const ln of lines) {
            const parts = ln.split(/(?<=[.!?])\s+|\s*[-•]\s+/).map(x => x.trim()).filter(Boolean);
            for (const p of parts) { if (p.length >= 20) sents.push(p); }
          }
        }
        const seen = new Set();
        const uniq = [];
        for (const s of sents) {
          const k = s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, '').slice(0, 140);
          if (!seen.has(k)) { seen.add(k); uniq.push(s); }
        }
        txtSentencesRef.current = uniq;
      } catch (e) {
        // no bloquear la UI
        console.warn('No se pudo cargar TXT RAG:', e);
      }
    }
    loadTxt();
    return () => { cancelled = true; };
  }, []);

  const ensureTxtSentences = useCallback(() => txtSentencesRef.current || [], []);

  function tokenize(text) { return (text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean); }

  const getRelevantTxtSentences = useCallback((query, max = 4) => {
    const sents = ensureTxtSentences();
    if (!sents.length) return [];
    const q = (query || '').toLowerCase();
    const toks = tokenize(q);
    if (!toks.length) return sents.slice(0, Math.min(max, sents.length));
    const scores = sents.map(st => {
      const low = st.toLowerCase(); let score = 0;
      for (const t of toks) if (t.length > 2 && low.includes(t)) score += 1;
      if (/per[uú]|renovable|co2|emisi/i.test(low)) score += 0.25;
      return score;
    });
    const idx = scores.map((s, i) => [s, i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    return idx.slice(0, max).map(i => sents[i]).filter(Boolean);
  }, [ensureTxtSentences]);

  const getRelevantKB = useCallback((query, max = 2) => {
    const q = (query || '').toLowerCase(); const toks = tokenize(q);
    if (!Array.isArray(knowledgeBase)) return [];
    const scored = knowledgeBase.map(item => {
      const text = [item.mision_titulo, item.tipo_mision, item.instrucciones_basicas, (item.pasos || []).join(' ')].join(' ').toLowerCase();
      let score = 0; for (const t of toks) if (t.length > 2 && text.includes(t)) score += 1;
      return { item, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, max).map(x => x.item);
    return scored;
  }, []);

  function sanitizePartialChat(text) {
    if (!text) return '';
    const cleaned = text.replace(/\[.*?\]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (cleaned.length > 260) {
      const lastDot = cleaned.lastIndexOf('.');
      if (lastDot > 120) return cleaned.slice(0, lastDot + 1);
      return cleaned.slice(0, 240).trim();
    }
    return cleaned;
  }

  function finalizeChatAnswer(text, userQ) {
    let cleaned = sanitizePartialChat(text);
    const parts = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
    cleaned = parts.slice(0, 3).join(' ');
    if (!cleaned || cleaned.length < 40) {
      const ctx = getRelevantTxtSentences(userQ, 2);
      if (ctx.length) return ctx.slice(0, 2).join(' ');
      return 'La energía renovable reduce emisiones y costos en el hogar. Describe tu recurso principal y te doy una misión sencilla.';
    }
    if (!/[.!?]$/.test(cleaned)) cleaned += '.';
    return cleaned;
  }

  const buildChatPrompt = useCallback((userInput, history = []) => {
    const recent = history.slice(-4).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');
    const txtCtx = getRelevantTxtSentences(userInput, 4);
    const kbCtx = getRelevantKB(userInput, 3).map(m => `- ${m.mision_titulo}: ${m.instrucciones_basicas || ''}`);
    const topic = (/e[óo]lica|viento/i.test(userInput) ? 'energía eólica (viento)' : 'energías renovables');
    const ctx = [
      txtCtx.length ? `Contexto del TXT:\n${txtCtx.map(s => `• ${s}`).join('\n')}` : '',
      kbCtx.length ? `Misiones relacionadas:\n${kbCtx.join('\n')}` : ''
    ].filter(Boolean).join('\n\n');
    return [
      `Tema: ${topic}. Responde en 1 párrafo corto (2–3 frases) y, si aplica, añade hasta 3 viñetas prácticas. Sé directo y concreto. Prioriza el contexto del TXT.`,
      ctx ? `Contexto:\n${ctx}` : '',
      recent ? `Historial breve:\n${recent}` : '',
      `Pregunta del usuario: ${userInput}`
    ].filter(Boolean).join('\n\n');
  }, [getRelevantTxtSentences, getRelevantKB]);

  const handleChatSend = useCallback(async (e) => {
    e?.preventDefault?.();
    if (isChatLoading || !chatInput.trim()) return;
    const q = chatInput.trim();
    const userMsg = { role: 'user', content: q };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      if (hasWebGPU && engineRef.current && isModelReady) {
        setStatusText('💬 Pensando…');
        const prompt = buildChatPrompt(q, chatMessages);
        const messages = [
          { role: 'system', content: 'Eres un asistente experto en sostenibilidad. Responde en español latino. Sé conciso.' },
          { role: 'user', content: prompt }
        ];
        
        // Usar chat.completions.create (API correcta de web-llm)
        const completion = await engineRef.current.chat.completions.create({
          messages,
          temperature: 0.1,
          max_tokens: 120,
          stream: false
        });
        
        const response = completion?.choices?.[0]?.message?.content || '';
        const cleanResponse = finalizeChatAnswer(response, q);
        setChatMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
        setStatusText('✅ Respuesta lista.');
      } else {
        // Fallback RAG local (sin modelo)
        const txtCtx = getRelevantTxtSentences(q, 2);
        const kbCtx = getRelevantKB(q, 2);
        const reply = kbCtx.length
          ? `${kbCtx[0].mision_titulo} — ${kbCtx[0].instrucciones_basicas || ''}\n\nDato: ${txtCtx[0] || ''}`
          : (txtCtx[0] || 'La energía renovable reduce emisiones y costos en el hogar. Describe tu recurso y te doy una misión sencilla.');
        
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setStatusText('✅ Respuesta (RAG) lista.');
      }
    } catch (err) {
      console.error('Error en chat:', err);
      const fallback = (getRelevantTxtSentences(q, 2) || []).slice(0, 2).join(' ') || 'La energía renovable reduce emisiones y costos en el hogar.';
      setChatMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      setStatusText('❌ Error en el chat.');
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, chatMessages, getRelevantKB, getRelevantTxtSentences, hasWebGPU, isModelReady, isChatLoading, buildChatPrompt]);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
      <div className="text-sm text-gray-700 font-semibold mb-2">Chat Offline — Energías Renovables (Perú)</div>

      <div className="text-xs text-gray-600 mb-2">{statusText}</div>

      <div className="h-56 overflow-auto bg-emerald-50 rounded-xl p-3 text-sm text-gray-800 shadow-inner">
        {chatMessages.map((m, idx) => (
          <div key={idx} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-800 border'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex items-center gap-2 text-emerald-700">
            <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Pensando…</span>
          </div>
        )}
      </div>

      <form onSubmit={handleChatSend} className="flex gap-2 mt-3">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Escribe tu pregunta…"
          disabled={isChatLoading}
          required
        />
        <button type="submit" disabled={isChatLoading} className={`px-4 py-3 rounded-lg font-bold text-white ${isChatLoading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
          Enviar
        </button>
      </form>
    </div>
  );
}