'use client';

import { useState, useEffect, useCallback } from 'react';
import { missions } from '@/lib/game-data';

const GAME_PROGRESS_KEY = 'hiri_game_progress';

interface GameProgress {
  score: number;
  completedMissions: string[];
  unlockedCards: string[];
  earnedBadges: string[];
}

const initialProgress: GameProgress = {
  score: 0,
  completedMissions: [],
  unlockedCards: [],
  earnedBadges: [],
};

export const useGameProgress = () => {
  const [playerName, setPlayerName] = useState('Explorador');
  const [progress, setProgress] = useState<GameProgress>({...initialProgress, score: 1000});
  const [isLoaded, setIsLoaded] = useState(false);

  const resetProgress = useCallback(() => {
    setPlayerName('Explorador');
  setProgress({ ...initialProgress, score: 1000 }); // Start with higher default energy
  }, []);

  useEffect(() => {
    resetProgress();
    setIsLoaded(true);
  }, [resetProgress]);


  const completeMission = useCallback((missionId: string) => {
    if (progress.completedMissions.includes(missionId)) return;

    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;

    setProgress((prev) => {
        if(prev.score < mission.points) return prev;

        const newUnlockedCards = mission.cardId && !prev.unlockedCards.includes(mission.cardId)
        ? [...prev.unlockedCards, mission.cardId]
        : prev.unlockedCards;
      
      const newEarnedBadges = mission.badgeId && !prev.earnedBadges.includes(mission.badgeId)
        ? [...prev.earnedBadges, mission.badgeId]
        : prev.earnedBadges;

        return {
            score: prev.score - mission.points,
            completedMissions: [...prev.completedMissions, missionId],
            unlockedCards: newUnlockedCards,
            earnedBadges: newEarnedBadges,
        }
    });

  }, [progress.completedMissions, progress.score]);

  // Completa una misión sin gastar energía (caso: ya fue pagada antes de colocar)
  const completeMissionPaid = useCallback((missionId: string) => {
    if (progress.completedMissions.includes(missionId)) return;

    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;

    setProgress((prev) => {
      if (prev.completedMissions.includes(missionId)) return prev;

      const newUnlockedCards = mission.cardId && !prev.unlockedCards.includes(mission.cardId)
        ? [...prev.unlockedCards, mission.cardId]
        : prev.unlockedCards;

      const newEarnedBadges = mission.badgeId && !prev.earnedBadges.includes(mission.badgeId)
        ? [...prev.earnedBadges, mission.badgeId]
        : prev.earnedBadges;

      return {
        score: prev.score, // no cambia
        completedMissions: [...prev.completedMissions, missionId],
        unlockedCards: newUnlockedCards,
        earnedBadges: newEarnedBadges,
      };
    });
  }, [progress.completedMissions]);

  const addScore = useCallback((amount: number) => {
    setProgress(prev => ({ ...prev, score: prev.score + amount }));
  }, []);

  return {
    playerName,
    setPlayerName,
    progress,
    isLoaded,
    completeMission,
    completeMissionPaid,
    addScore,
    resetProgress,
  };
};
