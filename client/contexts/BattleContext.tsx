import React, { createContext, useContext, useState, useCallback } from 'react';
import { Team } from '../models/Team';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface Battle {
  id: string;
  userId: string;
  oppponentId: string;
  userTeam: Team | null;
  opponentTeam: Team | null;
  currentTurn: string;
}

interface BattleContextType {
  battles: Battle[];
  currentBattle?: Battle;
  setTeam: (battleId: string, userTeam: Team) => void;
  submitAction: (battleId: string, action: BattleAction) => void;
  joinBattle: (battleId: string) => void;
  leaveBattle: (battleId: string) => void;
  newBattle: (userId: string, opponentId: string) => string;
}

interface BattleAction {
  spiritId: string;
  targetId: string;
  moveId: string;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
      throw new Error('useBattles must be used within a BattleProvider');
  }
  return context;
}

export const BattleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle>();

  const newBattle = useCallback((userId: string, opponentId: string): string => {
    const battleId = uuidv4();
    const newBattle: Battle = {
      id: battleId,
      userId: userId,
      oppponentId: opponentId,
      userTeam: null,
      opponentTeam: null,
      currentTurn: userId,
    };
    
    setBattles(prev => [...prev, newBattle]);
    return battleId;
  }, []);

  const setTeam = useCallback((battleId: string, userTeam: Team) => {
    setBattles(prev => {
      const battleIndex = prev.findIndex(battle => battle.id === battleId);
      if (battleIndex === -1) {
        throw new Error(`Battle with id ${battleId} not found`);
      }
      const updatedBattles = [...prev];
      updatedBattles[battleIndex] = {
        ...updatedBattles[battleIndex],
        userTeam,
      };
      return updatedBattles;
    });
  }, []);

  const submitAction = useCallback((battleId: string, action: BattleAction) => {
    setBattles(prev => {
      const battleIndex = prev.findIndex(battle => battle.id === battleId);
      if (battleIndex === -1) return prev;

      const battle = prev[battleIndex];
      // Process battle action and update spirits' states
      // This is where you would implement battle mechanics

      const updatedBattles = [...prev];
      updatedBattles[battleIndex] = {
        ...battle,
        currentTurn: battle.currentTurn === battle.userId 
          ? battle.oppponentId 
          : battle.userId
      };
      return updatedBattles;
    });
  }, []);

  const joinBattle = useCallback((battleId: string) => {
    const battle = battles.find(b => b.id === battleId);
    if (battle) {
      setCurrentBattle(battle);
    }
  }, [battles]);

  const leaveBattle = useCallback((battleId: string) => {
    setCurrentBattle(undefined);
  }, []);

  return (
    <BattleContext.Provider value={{
      battles,
      currentBattle,
      setTeam,
      submitAction,
      joinBattle,
      leaveBattle,
      newBattle
    }}>
      {children}
    </BattleContext.Provider>
  );
};