import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../models/Team';

type TeamsContextType = {
  addOrUpdateTeam: (team: Team) => Promise<void>;
  getTeam: (teamId: string) => Team | undefined;
  getTeams: () => Team[];
  setEditTeam: (teamId: string | null) => void;
  getEditTeam: () => Team;
  deleteTeam: (teamId: string) => Promise<void>;
};

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function useTeams() {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Map<string, Team>>(new Map());
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const storedTeams = await AsyncStorage.getItem('teams');
    if (storedTeams) {
      const teamsArray = JSON.parse(storedTeams);
      const teamsMap = new Map<string, Team>(teamsArray.map((team: Team) => [team.id, team]));
      setTeams(teamsMap);
    }
    setIsLoaded(true);
  };

  const getTeam = useCallback((teamId: string) => {
    return teams.get(teamId);
  }, [teams]);

  const addOrUpdateTeam = useCallback(async (newTeam: Team) => {
    const updatedTeams = new Map(teams);
    updatedTeams.set(newTeam.id, newTeam);
    setTeams(updatedTeams);
    
    const teamsArray = Array.from(updatedTeams.values());
    await AsyncStorage.setItem('teams', JSON.stringify(teamsArray));
  }, [teams]);

  const deleteTeam = useCallback(async (teamId: string) => {
    const updatedTeams = new Map(teams);
    updatedTeams.delete(teamId);
    setTeams(updatedTeams);

    const teamsArray = Array.from(updatedTeams.values());
    await AsyncStorage.setItem('teams', JSON.stringify(teamsArray));
  }, [teams]);

  const getTeams = useCallback(() => {
    return Array.from(teams.values());
  }, [teams]);

  const setEditTeam = (teamId: string | null) => {
    setEditTeamId(teamId);
  };

  // Fetches the team designated for editing or returns a new team if no team is designated or the team ID is missing.
  const getEditTeam = useCallback(() => {
    if (editTeamId  !== null) {
      const team = teams.get(editTeamId);
      if (team) {
        return team;
      }
    }
    const editTeam:  Team = {
      id: Math.random().toString(36).substring(2, 15),
      name: 'New Team',
      spirits: [],
    };
    return editTeam;
  }, [editTeamId, teams]);

  if (!isLoaded) {
    return null;
  }

  const value = {
    addOrUpdateTeam,
    getTeam,
    getTeams,
    setEditTeam,
    getEditTeam,
    deleteTeam,
  };
  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
}