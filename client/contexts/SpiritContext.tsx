import React, { createContext, useContext } from 'react'
import { Spirit, SpiritRawData, isCompleteSpirit } from '@/models/Spirit'
import axios from 'axios';
import { useAuth } from './AuthContext';

type SpiritContextType = {
  getSpirit: (spiritId: string) => Promise<Spirit | undefined>
  getSpirits: (spiritIds: string[]) => Promise<Spirit[] | undefined>
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

  const getSpirit = async (spiritId: string) => {
    const spirit = await getSpirits([spiritId]);
    if (spirit && spirit.length > 0) {
      return spirit[0];
    }
    return undefined;
  }

  const getSpirits = async (spiritIds: string[]): Promise<Spirit[] | undefined> => {
    const spirits = await getUserSpirits();
    return spirits.filter(spirit => spiritIds.includes(spirit.id as string));
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
      const spiritsRawData = response.data as SpiritRawData[];
      if (!spiritsRawData) {
        console.log('No spirits found.');
        return [];
      }
      return spiritsRawData.filter(isCompleteSpirit)
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
