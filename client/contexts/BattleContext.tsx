import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Action, ActionType } from '@/models/Action';
import { Battle, Position } from '@/models/Battle';
import { Spirit } from '@/models/Spirit';
import { useTeams } from '@/contexts/TeamContext';
import { processAction } from '@/utils/ActionProcessor';
import { Team } from '@/models/Team';

function deepCopyTeam(team: Team): Team {
  return {
    id: team.id,
    name: team.name,
    spirits: team.spirits.map(spirit => ({
      ...spirit,
      currentHitPoints: spirit.currentHitPoints,
      maxHitPoints: spirit.maxHitPoints
    }))
  }
}

const initBattlePositionMap = (bottomArenaTeam: Spirit[], topArenaTeam: Spirit[]): Map<Position, Spirit> => {
  return new Map<Position, Spirit>([
    [Position.TOP_BENCH_LEFT, topArenaTeam[3]],
    [Position.TOP_BENCH_CENTER, topArenaTeam[4]],
    [Position.TOP_BENCH_RIGHT, topArenaTeam[5]],
    [Position.TOP_MIDDLE_LEFT, topArenaTeam[1]],
    [Position.TOP_MIDDLE_RIGHT, topArenaTeam[2]],
    [Position.TOP_FRONTLINE_CENTER, topArenaTeam[0]],
    [Position.BOTTOM_FRONTLINE_CENTER, bottomArenaTeam[0]],
    [Position.BOTTOM_MIDDLE_LEFT, bottomArenaTeam[1]],
    [Position.BOTTOM_MIDDLE_RIGHT, bottomArenaTeam[2]],
    [Position.BOTTOM_BENCH_LEFT, bottomArenaTeam[3]],
    [Position.BOTTOM_BENCH_CENTER, bottomArenaTeam[4]],
    [Position.BOTTOM_BENCH_RIGHT, bottomArenaTeam[5]]
  ]);
}

interface BattleContextType {
  currentBattleContext?: Battle;
  setCurrentBattle: (battleId: string) => void;
  submitAction: (battleId: string, action: Action) => void;
  newBattle: (playerOneUserId: string, playerTwoUserId: string, playerOneTeamId: string, playerTwoTeamId: string) => string;
  getBattles: () => Map<string, Battle>;
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
  const [currentBattleContext, setCurrentBattleContext] = useState<Battle>();
  const { getTeam } = useTeams();

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
    console.log('newBattle', battleId);
    console.log('playerOneUserId', playerOneUserId);
    console.log('playerTwoUserId', playerTwoUserId);
    console.log('playerOneTeamId', playerOneTeamId);
    console.log('playerTwoTeamId', playerTwoTeamId);
    const playerOneTeam = getTeam(playerOneTeamId);
    const playerTwoTeam = getTeam(playerTwoTeamId);
    if (!playerOneTeam) {
      throw new Error('Team 1 not found');
    }
    const playerOneTeamCopy = deepCopyTeam(playerOneTeam);
    if (!playerTwoTeam) {
      throw new Error('Team 2 not found');
    }
    const playerTwoTeamCopy = deepCopyTeam(playerTwoTeam);
    const newBattle: Battle = {
      id: battleId,
      playerOneUserId,
      playerTwoUserId,
      playerOneTeamId,
      playerTwoTeamId,
      currentTurnUserId: null,
      positionMap: initBattlePositionMap(playerOneTeamCopy.spirits, playerTwoTeamCopy.spirits),
    };
    
    setBattles(prev => {
      const updated = new Map(prev).set(battleId, newBattle);
      saveBattles(updated);
      return updated;
    });
    return battleId;
  }, [getTeam]);

  const submitAction = useCallback((battleId: string, action: Action) => {
    setBattles(prev => {
      const battle = prev.get(battleId);
      if (!battle) return prev;

      console.log("TOP_FRONTLINE_CENTER spirit:", battle.positionMap.get(Position.TOP_FRONTLINE_CENTER));
      console.log("TOP_FRONTLINE_CENTER hit points pre-attack:", battle.positionMap.get(Position.TOP_FRONTLINE_CENTER)?.currentHitPoints);
      const updatedBattle = processAction(battle, action);
      console.log("TOP_FRONTLINE_CENTER hit points post-attack:", battle.positionMap.get(Position.TOP_FRONTLINE_CENTER)?.currentHitPoints);

      const updated = new Map(prev).set(battleId, {
        ...updatedBattle});
      saveBattles(updated);
      return updated;
    });
  }, []);

  const setCurrentBattle = useCallback((battleId: string) => {
    const battle = getBattle(battleId);
    if (battle) {
      setCurrentBattleContext(battle);
    }
  }, [getBattle]);

  return (
    <BattleContext.Provider value={{
      currentBattleContext,
      setCurrentBattle,
      submitAction,
      newBattle,
      getBattles
    }}>
      {children}
    </BattleContext.Provider>
  );
};