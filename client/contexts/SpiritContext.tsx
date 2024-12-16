import React, { createContext, useContext } from 'react'
import { Spirit } from '@/models/Spirit'
import axios from 'axios';
import { useAuth } from './AuthContext';

type SpiritContextType = {
  getSpirit: (spiritId: string) => Spirit | undefined
  getSpirits: (spiritIds: string[]) => Spirit[] | undefined
  getUserSpirits: () => Promise<Spirit[]>
}

const SpiritContext = createContext<SpiritContextType | undefined>(undefined)

export function useSpiritContext() {
  const context = useContext(SpiritContext)
  if (!context) {
    throw new Error('useSpirits must be used within a SpiritsProvider')
  }
  return context
}

export function SpiritProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const getSpirit = (spiritId: string) => {
    // TODO: Implement spirit fetching logic
    return undefined
  }

  const getSpirits = (spiritIds: string[]) => {
    // TODO: Implement spirit fetching logic
    return undefined
  }

  async function getUserSpirits(): Promise<Spirit[]> {
    if (!user) throw new Error('User not logged in.');
    const url = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
    if (url == undefined) {
      throw Error('API URL is not set.');
    }
    const idToken = await user.getIdToken();
    const endpoint = url + '/FetchSpirits';
    console.log('FetchSpirits Endpoint:', endpoint);
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const spiritsData = response.data as Spirit[];
      if (!spiritsData) {
        console.log('No spirits found.');
        return [];
      }
      var filtered_spirits = spiritsData.filter(
        (spirit) =>
          spirit.id !== null &&
          spirit.name !== null &&
          spirit.description !== null &&
          spirit.primaryType !== null &&
          spirit.secondaryType !== null &&
          spirit.originalImageDownloadUrl !== null &&
          spirit.generatedImageDownloadUrl !== null &&
          spirit.agility !== null &&
          spirit.arcana !== null &&
          spirit.aura !== null &&
          spirit.charisma !== null &&
          spirit.endurance !== null &&
          spirit.height !== null &&
          spirit.weight !== null &&
          spirit.intimidation !== null &&
          spirit.luck !== null &&
          spirit.strength !== null &&
          spirit.toughness !== null
      );
      return filtered_spirits;
    } catch (error) {
      console.error('Error fetching spirts:', error);
      return [];
    }
  }

  return (
    <SpiritContext.Provider value={{ getSpirit, getSpirits, getUserSpirits }}>
      {children}
    </SpiritContext.Provider>
  )
}
