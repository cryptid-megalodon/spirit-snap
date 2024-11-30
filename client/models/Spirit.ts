export interface Spirit {
    id: string;
    name: string;
    description: string;
    primaryType: string;
    secondaryType: string;
    originalImageDownloadUrl: string;
    generatedImageDownloadUrl: string;

    agility: number | null;
    arcana: number | null;
    aura: number | null;
    charisma: number | null;
    endurance: number | null;
    height: number | null;
    weight: number | null;
    intimidation: number | null;
    luck: number | null;
    strength: number | null;
    toughness: number | null;
  }
  