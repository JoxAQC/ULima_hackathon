'use server';

import { z } from 'zod';
import type { Mission } from '@/lib/data';

// Offline, rule-based recommendation inspired by the logic in /generador-misiones-chatbot (no remote AI).

const RecommendMissionsInputSchema = z.object({
  materials: z.string().describe('Una lista de materiales disponibles, separados por comas.'),
  allMissions: z.custom<Mission[]>(),
});
export type RecommendMissionsInput = z.infer<typeof RecommendMissionsInputSchema>;

const RecommendMissionsOutputSchema = z.object({
  recommendedMissionIds: z
    .array(z.number())
    .describe('Una lista de IDs de misiones recomendadas basadas en los materiales.'),
});
export type RecommendMissionsOutput = z.infer<typeof RecommendMissionsOutputSchema>;

export async function recommendMissions(
  input: RecommendMissionsInput
): Promise<RecommendMissionsOutput> {
  const { materials, allMissions } = RecommendMissionsInputSchema.parse(input);

  // Tokeniza materiales del usuario (similar a la app offline):
  const materialTokens = materials
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  // Si no hay tokens útiles, devuelve fallback directo
  if (materialTokens.length === 0 || allMissions.length === 0) {
    const fallback = pickFallback(allMissions);
    return { recommendedMissionIds: fallback ? [fallback.id] : [] };
  }

  // Construye un texto de cada misión para scoring (título + descripción + pasos)
  const scored = allMissions.map((m) => {
    const text = [
      m.title,
      m.description,
      ...m.steps.flatMap((s) => [s.title, s.description]),
    ]
      .join(' ')
      .toLowerCase();

    // Cuenta coincidencias de tokens simples
    let score = 0;
    for (const tok of materialTokens) {
      if (text.includes(tok)) score += 1;
    }

    // Heurísticas inspiradas en el generador offline para reforzar temática:
    const joined = materialTokens.join(' ');
    if (/solar|fotovoltaic|panel|luz|botella/.test(joined) && m.category === 'Iluminación') {
      score += 1.5; // iluminación y solar suelen ir de la mano
    }
    if (/agua|ducha|manguera|termo|calentar/.test(joined) && m.category === 'Climatización') {
      score += 1.5; // climatización/agua caliente
    }
    if (/viento|e[oó]lica|aspa|molino|turbina|motor/.test(joined) && m.category === 'Micro-Generación') {
      score += 1.5; // microgeneración eólica
    }

    // Pequeño refuerzo por misiones con más pasos relevantes (más detalle)
    score += Math.min(1, Math.max(0, (m.steps?.length || 0) - 2) * 0.15);

    return { id: m.id, score };
  });

  // Ordena por score desc; si empatan, prioriza más EXP (más valiosa) y luego menor id
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ma = allMissions.find((m) => m.id === a.id);
    const mb = allMissions.find((m) => m.id === b.id);
    if (ma && mb && mb.exp !== ma.exp) return mb.exp - ma.exp;
    return a.id - b.id;
  });

  const top = scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.id);

  if (top.length > 0) return { recommendedMissionIds: top };

  // Fallback si nada coincide
  const fallback = pickFallback(allMissions);
  return { recommendedMissionIds: fallback ? [fallback.id] : [] };
}

function pickFallback(allMissions: Mission[]): Mission | undefined {
  // Preferimos una misión amplia y accesible; si existe la 5 (Molino de Viento) la usamos,
  // de lo contrario tomamos la que tenga categoría Iluminación o la primera.
  return (
    allMissions.find((m) => m.id === 5) ||
    allMissions.find((m) => m.category === 'Iluminación') ||
    allMissions[0]
  );
}
