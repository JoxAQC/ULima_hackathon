
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { missions } from '@/lib/data';

export type User = {
  name: string;
  age: number;
  segment: 'Adult' | 'Youth';
  progress: {
    missionsCompleted: number[];
    exp: number;
    credits: number;
    financialSavings: number;
    co2Saved: number;
  };
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  createUser: (name: string, age: number) => void;
  updateProgress: (missionId: number, exp: number, credits: number, savings: number, co2: number) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('hiri-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        document.body.className = `theme-${parsedUser.segment.toLowerCase()}`;
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('hiri-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback((name: string, age: number) => {
    const segment = age >= 18 ? 'Adult' : 'Youth';
    const initialMissionId = segment === 'Adult' ? 2 : 1;
    const initialMission = missions.find(m => m.id === initialMissionId);

    const newUser: User = {
      name,
      age,
      segment,
      progress: {
        missionsCompleted: initialMission ? [initialMission.id] : [],
        exp: initialMission ? initialMission.exp : 0,
        credits: initialMission ? initialMission.credits : 0,
        financialSavings: initialMission ? initialMission.financialSavings : 0,
        co2Saved: initialMission ? initialMission.co2Saved : 0,
      },
    };
    localStorage.setItem('hiri-user', JSON.stringify(newUser));
    setUser(newUser);
    document.body.className = `theme-${segment.toLowerCase()}`;
    router.push('/home');
  }, [router]);

  const updateProgress = useCallback((missionId: number, exp: number, credits: number, savings: number, co2: number) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        progress: {
          ...user.progress,
          missionsCompleted: [...user.progress.missionsCompleted, missionId],
          exp: user.progress.exp + exp,
          credits: user.progress.credits + credits,
          financialSavings: user.progress.financialSavings + savings,
          co2Saved: (user.progress.co2Saved || 0) + co2,
        },
      };
      localStorage.setItem('hiri-user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [user]);

  const clearUser = useCallback(() => {
    localStorage.removeItem('hiri-user');
    setUser(null);
    document.body.className = '';
    router.push('/create-profile');
  }, [router]);

  return (
    <UserContext.Provider value={{ user, isLoading, createUser, updateProgress, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
