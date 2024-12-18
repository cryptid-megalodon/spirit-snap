export interface SpiritRawData {
    id: string | null;
    name: string | null;
    description: string | null;
    primaryType: string | null;
    secondaryType: string | null;
    originalImageDownloadUrl: string | null;
    generatedImageDownloadUrl: string | null;

    agility: number | null;
    arcana: number | null;
    aura: number | null;
    charisma: number | null;
    endurance: number | null;
    height: number | null;
    weight: number | null;
    intimidation: number | null;
    luck: number | null;
    hitPoints: number | null;
    strength: number | null;
    toughness: number | null;
  }
  
export interface Spirit {
    id: string;
    name: string;
    description: string;
    primaryType: string;
    secondaryType: string;
    originalImageDownloadUrl: string;
    generatedImageDownloadUrl: string;

    agility: number;
    arcana: number;
    aura: number;
    charisma: number;
    endurance: number;
    height: number;
    weight: number;
    intimidation: number;
    luck: number;
    hitPoints: number;
    strength: number;
    toughness: number;
  }

// Utility function to check if a SpiritRawData is complete.
// Note: If true, TypeScript will treat it as a Spirit object.
export function isCompleteSpirit(spirit: SpiritRawData): spirit is Spirit {
  return spirit.id !== null &&
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
    spirit.hitPoints !== null &&
    spirit.strength !== null &&
    spirit.toughness !== null
}