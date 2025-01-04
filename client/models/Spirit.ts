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
    maxHitPoints: number;
    currentHitPoints: number;
    strength: number;
    toughness: number;
  }

// Utility function to check if a SpiritRawData is complete.
export function isCompleteSpirit(spirit: SpiritRawData): boolean {
  return spirit.id != null &&
    spirit.name != null &&
    spirit.description != null &&
    spirit.primaryType != null &&
    spirit.secondaryType != null &&
    spirit.originalImageDownloadUrl != null &&
    spirit.generatedImageDownloadUrl != null &&
    spirit.agility != null &&
    spirit.arcana != null &&
    spirit.aura != null &&
    spirit.charisma != null &&
    spirit.endurance != null &&
    spirit.height != null &&
    spirit.weight != null &&
    spirit.intimidation != null &&
    spirit.luck != null &&
    spirit.hitPoints != null &&
    spirit.strength != null &&
    spirit.toughness != null
}

export function convertSpiritRawDataToSpirit(spirit: SpiritRawData): Spirit {
  if (!isCompleteSpirit(spirit)) {
    throw new Error('Spirit data is incomplete');
  }
  return {
    id: spirit.id as string,
    name: spirit.name as string,
    description: spirit.description as string,
    primaryType: spirit.primaryType as string,
    secondaryType: spirit.secondaryType as string,
    originalImageDownloadUrl: spirit.originalImageDownloadUrl as string,
    generatedImageDownloadUrl: spirit.generatedImageDownloadUrl as string,
    agility: spirit.agility as number,
    arcana: spirit.arcana as number,
    aura: spirit.aura as number,
    charisma: spirit.charisma as number,
    endurance: spirit.endurance as number,
    height: spirit.height as number,
    weight: spirit.weight as number,
    intimidation: spirit.intimidation as number,
    luck: spirit.luck as number,
    maxHitPoints: spirit.hitPoints as number,
    currentHitPoints: spirit.hitPoints as number,
    strength: spirit.strength as number,
    toughness: spirit.toughness as number  }
}