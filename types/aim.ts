export interface AIMFile {
  id: string
  oraNumber: string
  oraName: string
  oraImage: string
  createdAt: string
  updatedAt: string

  // Core Identity
  characterName: string
  nickname?: string
  age?: number
  species?: string

  // Personality Matrix
  personality: {
    primaryTraits: string[]
    secondaryTraits: string[]
    alignment:
      | "Lawful Good"
      | "Neutral Good"
      | "Chaotic Good"
      | "Lawful Neutral"
      | "True Neutral"
      | "Chaotic Neutral"
      | "Lawful Evil"
      | "Neutral Evil"
      | "Chaotic Evil"
    temperament: string
    motivations: string[]
    fears: string[]
    quirks: string[]
  }

  // Background & History
  backstory: {
    origin: string
    childhood: string
    formativeEvents: string[]
    relationships: Array<{
      name: string
      relationship: string
      description: string
    }>
    achievements: string[]
    failures: string[]
  }

  // Abilities & Skills
  abilities: {
    strengths: string[]
    weaknesses: string[]
    specialPowers: string[]
    skills: Array<{
      name: string
      level: number // 1-10
      description: string
    }>
  }

  // Behavioral Patterns
  behavior: {
    speechPatterns: string
    mannerisms: string[]
    habits: string[]
    socialStyle: "Extroverted" | "Introverted" | "Ambivert"
    conflictResolution: string
    decisionMaking: string
  }

  // Physical & Visual
  appearance: {
    height?: string
    build?: string
    distinctiveFeatures: string[]
    clothing: string
    accessories: string[]
  }

  // Goals & Aspirations
  goals: {
    shortTerm: string[]
    longTerm: string[]
    dreams: string[]
    currentQuest?: string
  }

  // Metadata
  tags: string[]
  notes: string
  version: string
}

export interface AIMTemplate {
  id: string
  name: string
  description: string
  category: string
  template: Partial<AIMFile>
}

export type AIM = {
  meta: { oraNumber: number; source: "user" | "ai" | "merged"; updatedAt: string }
  personality: { primary: string[]; secondary?: string[]; alignment?: string }
  backstory: { origin?: string; beats?: string[] }
  abilities: { strengths?: string[]; weaknesses?: string[]; skills?: string[] }
  behavior: { speech?: string; mannerisms?: string[] }
  visuals: { palette?: string[]; motifs?: string[]; doNotChange?: string[] }
}

export type AIMDelta = {
  patch: Partial<AIM>
  confidence: Record<string, number>
}

export type PromptBundle = {
  portrait: string[]
  action: string[]
  sticker: string[]
  wallpaper: string[]
  negative?: string[]
  seeds?: string[]
}
