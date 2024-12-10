import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../models/Team';
import { Spirit } from '../models/Spirit';

type TeamsContextType = {
  addOrUpdateTeam: (team: Team) => Promise<void>;
  getTeam: (teamId: string) => Team | undefined;
  getTeams: () => Team[];
  setEditTeam: (teamId: string | null) => void;
  getEditTeam: () => Team;
};

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Map<string, Team>>(new Map());
  const [editTeamId, setEditTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const storedTeams = await AsyncStorage.getItem('teams');
    if (storedTeams) {
      const teamsArray = JSON.parse(storedTeams);
      const teamsMap = new Map(teamsArray.map((team: Team) => [team.id, team]));
      setTeams(teamsMap);
    }
  };

  const addOrUpdateTeam = async (newTeam: Team) => {
    const updatedTeams = new Map(teams);
    updatedTeams.set(newTeam.id, newTeam);
    setTeams(updatedTeams);
    
    const teamsArray = Array.from(updatedTeams.values());
    await AsyncStorage.setItem('teams', JSON.stringify(teamsArray));
  };

  const getTeam = (teamId: string) => {
    return teams.get(teamId);
  };

  const getTeams = () => {
    return Array.from(teams.values());
  };

  const setEditTeam = (teamId: string | null) => {
    if (teamId === null) {
      setEditTeamId(null);
      return;
    }
    setEditTeamId(teamId);
  };

  // Fetches the team designated for editing or returns a new team if no team is designated or the team ID is missing.
  const getEditTeam = () => {
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
  };

  return (
    <TeamsContext.Provider value={{ addOrUpdateTeam, getTeam, getTeams, setEditTeam, getEditTeam }}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}