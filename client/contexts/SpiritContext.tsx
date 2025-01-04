import React, { createContext, useContext } from 'react'
import { Spirit, SpiritRawData, isCompleteSpirit, convertSpiritRawDataToSpirit } from '@/models/Spirit'
import axios from 'axios';
import { useAuth } from './AuthContext';

type SpiritContextType = {
  createSpirit: (base64Image: string) => Promise<Spirit>
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

  // Main endpoint into processing user images.
  // Function to make API call to process the camera image using the backend server.
  const createSpirit = async (base64Image: string): Promise<Spirit> => {
    const url = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
    if (url == undefined) {
      throw Error("API URL is not set.")
    }
    if (user == null) {
      throw new Error("User not logged in");
    }
    const idToken = await user.getIdToken();
    const endpoint = url + "/ProcessImage";
    console.log("Process Image Endpoint:", endpoint)
    try {
      const response = await axios.post(
        endpoint,
        {
          'base64Image': base64Image,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        }
      );
      console.log("ProcessImage Response Status:", response.status);
      const spiritRawData = response.data as SpiritRawData;
      if (!spiritRawData) {
        console.log('No spirit data returned.');
        return {} as Spirit;
      }
      if (isCompleteSpirit(spiritRawData)) {
        return convertSpiritRawDataToSpirit(spiritRawData);
      } else {
        console.log('Incomplete spirit data.');
        return {} as Spirit;
      }
    } catch (error) {
      console.error('Error fetching image caption:', error);
      return {} as Spirit;
    }
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
      const validSpiritData = spiritsRawData.filter(isCompleteSpirit)
      return validSpiritData.map(convertSpiritRawDataToSpirit);
    } catch (error) {
      console.error('Error fetching spirts:', error);
      return [];
    }
  }
  return (
    <SpiritContext.Provider value={{ createSpirit, getSpirit, getSpirits, getUserSpirits }}>
      {children}
    </SpiritContext.Provider>
  )
}
