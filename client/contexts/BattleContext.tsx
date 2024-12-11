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
  currentBattle?: Battle;
  setTeam: (battleId: string, userTeam: Team) => void;
  submitAction: (battleId: string, action: BattleAction) => void;
  joinBattle: (battleId: string) => void;
  leaveBattle: (battleId: string) => void;
  newBattle: (userId: string, opponentId: string) => string;
  getBattle: (battleId: string) => Battle | undefined;
  getBattles: () => Map<string, Battle>;
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
  const [battles, setBattles] = useState<Map<string, Battle>>(new Map());
  const [currentBattle, setCurrentBattle] = useState<Battle>();

  const getBattle = useCallback((battleId: string) => {
    return battles.get(battleId);
  }, [battles]);

  const getBattles = useCallback(() => {
    return battles;
  }, [battles]);

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
    
    setBattles(prev => new Map(prev).set(battleId, newBattle));
    return battleId;
  }, []);

  const setTeam = useCallback((battleId: string, userTeam: Team) => {
    setBattles(prev => {
      const battle = prev.get(battleId);
      if (!battle) {
        throw new Error(`Battle with id ${battleId} not found`);
      }
      return new Map(prev).set(battleId, {
        ...battle,
        userTeam,
      });
    });
  }, []);

  const submitAction = useCallback((battleId: string, action: BattleAction) => {
    setBattles(prev => {
      const battle = prev.get(battleId);
      if (!battle) return prev;

      // Process battle action and update spirits' states
      // This is where you would implement battle mechanics

      return new Map(prev).set(battleId, {
        ...battle,
        currentTurn: battle.currentTurn === battle.userId 
          ? battle.oppponentId 
          : battle.userId
      });
    });
  }, []);

  const joinBattle = useCallback((battleId: string) => {
    const battle = battles.get(battleId);
    if (battle) {
      setCurrentBattle(battle);
    }
  }, [battles]);

  const leaveBattle = useCallback((battleId: string) => {
    setCurrentBattle(undefined);
  }, []);

  return (
    <BattleContext.Provider value={{
      currentBattle,
      setTeam,
      submitAction,
      joinBattle,
      leaveBattle,
      newBattle,
      getBattle,
      getBattles
    }}>
      {children}
    </BattleContext.Provider>
  );
};