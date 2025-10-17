'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Mission } from '@/lib/data';

const RecommendMissionsInputSchema = z.object({
  materials: z.string().describe('Una lista de materiales disponibles, separados por comas.'),
  allMissions: z.custom<Mission[]>(),
});
export type RecommendMissionsInput = z.infer<typeof RecommendMissionsInputSchema>;

const RecommendMissionsOutputSchema = z.object({
  recommendedMissionIds: z.array(z.number()).describe('Una lista de IDs de misiones recomendadas basadas en los materiales.'),
});
export type RecommendMissionsOutput = z.infer<typeof RecommendMissionsOutputSchema>;


export async function recommendMissions(input: RecommendMissionsInput): Promise<RecommendMissionsOutput> {
  return recommendMissionsFlow(input);
}


const recommendMissionsFlow = ai.defineFlow(
  {
    name: 'recommendMissionsFlow',
    inputSchema: RecommendMissionsInputSchema,
    outputSchema: RecommendMissionsOutputSchema,
  },
  async ({ materials, allMissions }) => {
    // NOTE: This is a simple rule-based implementation for now.
    // This can be replaced with a more sophisticated RAG approach with an LLM.
    const userMaterials = materials.toLowerCase().split(',').map(m => m.trim());
    
    const recommendedMissionIds: number[] = [];

    for (const mission of allMissions) {
      // A very simple logic: if any material is mentioned in the mission steps, recommend it.
      const missionText = mission.steps.map(s => s.title.toLowerCase() + ' ' + s.description.toLowerCase()).join(' ');
      
      for(const material of userMaterials) {
        if (missionText.includes(material) && !recommendedMissionIds.includes(mission.id)) {
          recommendedMissionIds.push(mission.id);
        }
      }
    }

    // A fallback if no missions are found
    if (recommendedMissionIds.length === 0) {
        // Recommend a mission that doesn't require many materials
        const easyMission = allMissions.find(m => m.id === 5); // Cargador de Móvil con Dinamo
        if (easyMission) {
            recommendedMissionIds.push(easyMission.id);
        }
    }

    return { recommendedMissionIds };
  }
);
