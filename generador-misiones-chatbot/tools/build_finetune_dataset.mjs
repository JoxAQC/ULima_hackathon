#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_TXT = path.join(ROOT, 'src', 'energia_renovable_peru.txt');
const OUT_JSONL = path.join(ROOT, 'data', 'energia_peru_instruct.jsonl');

function readTxt(p) {
  return fs.readFileSync(p, 'utf8');
}

function splitSentences(text) {
  // Simple sentence segmentation
  return text
    .replace(/[\t\r]+/g, ' ')
    .replace(/ +/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 20);
}

function chunkByTokens(sentences, maxChars = 1200) {
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const s of sentences) {
    if (len + s.length + 1 > maxChars) {
      if (cur.length) chunks.push(cur.join(' '));
      cur = [s];
      len = s.length;
    } else {
      cur.push(s);
      len += s.length + 1;
    }
  }
  if (cur.length) chunks.push(cur.join(' '));
  return chunks;
}

function makeQaFromChunk(text) {
  // Heuristics: generate a short instruction and a grounded answer
  const lower = text.toLowerCase();
  let topic = 'energías renovables en el Perú';
  if (lower.includes('solar')) topic = 'energía solar';
  else if (lower.includes('eólica') || lower.includes('viento')) topic = 'energía eólica';
  else if (lower.includes('biomasa')) topic = 'energía de la biomasa';
  else if (lower.includes('minihidrául') || lower.includes('hidroel')) topic = 'energía minihidráulica';
  else if (lower.includes('geotérm')) topic = 'energía geotérmica';
  else if (lower.includes('fotovoltaic')) topic = 'sistemas fotovoltaicos';
  else if (lower.includes('beneficios')) topic = 'beneficios de los RER';
  else if (lower.includes('retos')) topic = 'retos de los RER';

  const instruction = `En 2–4 frases, explica de forma clara aspectos clave sobre ${topic} según el contexto. Si aplica, lista 2–4 beneficios o pasos.`;
  const completion = text;
  return { instruction, completion };
}

function toChatMessages(instruction, context, assistantText) {
  const system = { role: 'system', content: 'Eres un asistente técnico, claro y conciso en español latino.' };
  const user = { role: 'user', content: instruction + '\n\nContexto:\n' + context };
  const assistant = { role: 'assistant', content: assistantText };
  return [system, user, assistant];
}

function pickByKeywords(sentences, keywords, max = 3) {
  const lower = sentences.map(s => s.toLowerCase());
  const ranked = sentences.map((s, i) => {
    let score = 0;
    for (const kw of keywords) {
      if (lower[i].includes(kw)) score += 1;
    }
    // prefer medium length
    score -= Math.abs(s.length - 140) / 200;
    return { s, score };
  }).filter(x => x.score > 0.1)
    .sort((a,b) => b.score - a.score);
  return ranked.slice(0, max).map(x => x.s);
}

function summarizeTwo(sentences) {
  // Simple summary: select two informative sentences
  const clean = sentences.filter(s => !/foto:|gráfico|ilustración|cuadro|fuente:|elaboración:|ver |nota\./i.test(s));
  const ranked = clean.map(s => ({ s, score: 1 - Math.abs(s.length - 160) / 200 }))
    .sort((a,b) => b.score - a.score);
  const chosen = ranked.slice(0, 2).map(x => x.s);
  return chosen.join(' ');
}

function bulletsFrom(sentences, max = 3) {
  const picked = sentences.slice(0, max).map(s => s.length > 180 ? s.slice(0, 177) + '…' : s);
  return picked.map(s => `- ${s}`).join('\n');
}

function buildExamples(text) {
  // Remove editorial noise lines
  const cleaned = text
    .replace(/\bPRÓLOGO\b|\bINTRODUCCIÓN\b|\bÍNDICE\b|\bCONCLUSIONES?\b|\bGLOSARIO\b/gi, '')
    .replace(/Foto:[^\n]+/gi, '')
    .replace(/Gráfico [^\n]+/gi, '')
    .replace(/Ilustración [^\n]+/gi, '')
    .replace(/\n{2,}/g, '\n');

  const sentences = splitSentences(cleaned);
  const chunks = chunkByTokens(sentences, 1400);
  const items = [];
  const benefitsKW = ['beneficio','reduce','reducción','co2','contaminación','costo','ahorro','salud','acceso','diversific','descentraliz'];
  const retosKW = ['reto','intermitencia','tarifa','integración','impacto','dificultad','desafío','costos'];
  const defs = [
    { key: 'energía solar', match: ['solar','fotovoltaic','térmic'] },
    { key: 'energía eólica', match: ['eólica','viento','turbina'] },
    { key: 'energía de la biomasa', match: ['biomasa','combusti','pirólisis','gasificación'] },
    { key: 'energía minihidráulica', match: ['minihidr','hidroel','río','caudal'] },
    { key: 'energía geotérmica', match: ['geotérm'] },
    { key: 'sistemas fotovoltaicos autónomos', match: ['fotovoltaic','autónom'] },
  ];

  for (const ch of chunks) {
    const sents = splitSentences(ch);
    if (sents.length === 0) continue;

    // 1) Resumen breve (2 frases)
    const sum = summarizeTwo(sents);
    if (sum) {
      items.push({ messages: toChatMessages('Resume en 2 frases claras el contexto.', ch, sum), meta: { task: 'resumen2', chars: ch.length } });
    }

    // 2) Puntos clave (3 viñetas)
    const key3 = bulletsFrom(sents, 3);
    if (key3) {
      items.push({ messages: toChatMessages('Lista 3 puntos clave en viñetas (1 línea cada una).', ch, key3), meta: { task: 'puntos3', chars: ch.length } });
    }

    // 3) Beneficios (si aplica)
    const ben = pickByKeywords(sents, benefitsKW, 3);
    if (ben.length >= 2) {
      items.push({ messages: toChatMessages('Enumera 3 beneficios concretos (viñetas) según el contexto.', ch, bulletsFrom(ben, 3)), meta: { task: 'beneficios', chars: ch.length } });
    }

    // 4) Retos (si aplica)
    const ret = pickByKeywords(sents, retosKW, 3);
    if (ret.length >= 2) {
      items.push({ messages: toChatMessages('Enumera 3 retos o limitaciones (viñetas) según el contexto.', ch, bulletsFrom(ret, 3)), meta: { task: 'retos', chars: ch.length } });
    }

    // 5) Definiciones (si aplica, 1 frase)
    const lower = ch.toLowerCase();
    for (const d of defs) {
      if (d.match.some(m => lower.includes(m))) {
        const defSent = sents.find(s => s.toLowerCase().includes(d.match[0]) || s.toLowerCase().includes(d.key.split(' ')[1] || '')) || sents[0];
        const oneLine = defSent.length > 220 ? defSent.slice(0, 217) + '…' : defSent;
        items.push({ messages: toChatMessages(`Define en 1 frase qué es ${d.key}, basado en el contexto.`, ch, oneLine), meta: { task: 'definicion', key: d.key, chars: ch.length } });
      }
    }
  }
  return items;
}

function main() {
  const raw = readTxt(SRC_TXT);
  const items = buildExamples(raw);
  const out = fs.createWriteStream(OUT_JSONL, 'utf8');
  for (const it of items) {
    out.write(JSON.stringify(it) + '\n');
  }
  out.end();
  console.log(`Escribí ${items.length} ejemplos en`, OUT_JSONL);
}

main();
