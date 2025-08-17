export interface CMPFile {
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

export interface CMPTemplate {
  id: string
  name: string
  description: string
  category: string
  template: Partial<CMPFile>
}
