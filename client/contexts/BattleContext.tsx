import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Team } from '@/models/Team';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Battle } from '@/models/Battle';


interface BattleContextType {
  currentBattle?: Battle;
  submitAction: (battleId: string, action: BattleAction) => void;
  joinBattle: (battleId: string) => void;
  leaveBattle: (battleId: string) => void;
  newBattle: (playerOneUserId: string, playerTwoUserId: string, playerOneTeamId: string, playerTwoTeamId: string) => string;
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

  useEffect(() => {
    const loadBattles = async () => {
      try {
        const savedBattles = await AsyncStorage.getItem('battles');
        if (savedBattles) {
          const battlesArray = JSON.parse(savedBattles);
          setBattles(new Map(battlesArray));
        }
      } catch (error) {
        console.error('Error loading battles:', error);
      }
    };
    loadBattles();
  }, []);

  const saveBattles = async (battlesMap: Map<string, Battle>) => {
    try {
      const battlesArray = Array.from(battlesMap.entries());
      await AsyncStorage.setItem('battles', JSON.stringify(battlesArray));
    } catch (error) {
      console.error('Error saving battles:', error);
    }
  };

  const getBattle = useCallback((battleId: string) => {
    return battles.get(battleId);
  }, [battles]);

  const getBattles = useCallback(() => {
    return battles;
  }, [battles]);

  const newBattle = useCallback((playerOneUserId: string, playerTwoUserId: string, playerOneTeamId: string, playerTwoTeamId: string): string => {
    const battleId = uuidv4();
    const newBattle: Battle = {
      id: battleId,
      playerOneUserId,
      playerTwoUserId,
      playerOneTeamId,
      playerTwoTeamId,
      currentTurnUserId: null,
    };
    
    setBattles(prev => {
      const updated = new Map(prev).set(battleId, newBattle);
      saveBattles(updated);
      return updated;
    });
    return battleId;
  }, []);

  const submitAction = useCallback((battleId: string, action: BattleAction) => {
    setBattles(prev => {
      const battle = prev.get(battleId);
      if (!battle) return prev;

      // Process battle action and update spirits' states
      // This is where you would implement battle mechanics

      const updated = new Map(prev).set(battleId, {
        ...battle,
        currentTurnUserId: (battle.currentTurnUserId === battle.playerOneUserId)
        // Let next turn be the other player.
          ? battle.playerTwoUserId 
          : battle.playerOneUserId,
      });
      saveBattles(updated);
      return updated;
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