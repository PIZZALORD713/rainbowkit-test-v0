/** AIM v2 Schema - Structured data layers for NFT character management
 * Separates canonical NFT data from user-defined persona customizations
 */

export interface AIMv2 {
  // Core metadata
  version: "aim-2"
  id: string
  createdAt: string
  updatedAt: string

  // NFT Subject Information
  subject: {
    chain: string
    contract: string
    tokenId: string
    owner?: string
    collectionName: string
  }

  // Data Sources
  sources: {
    metadataUri: string
    fetchedAt: string
    metadataHash: string
    image: string
    openseaUrl: string
  }

  // Canonical NFT Data (immutable from blockchain/metadata)
  canonical: {
    traits: Record<string, string>
    raw?: any // Original metadata JSON
  }

  // Normalized Data (processed canonical data)
  normalized: {
    traits: Record<string, string>
    registryVersion?: string
    conflicts?: string[] // List of conflicting trait keys
  }

  // User-defined Persona (editable character data)
  persona: {
    title: string // Character name/title
    nickname?: string
    alignment?:
      | "Lawful Good"
      | "Neutral Good"
      | "Chaotic Good"
      | "Lawful Neutral"
      | "True Neutral"
      | "Chaotic Neutral"
      | "Lawful Evil"
      | "Neutral Evil"
      | "Chaotic Evil"
    tone: string // Personality/temperament
    tags: string[]
    lore: string // Backstory/description
    goals: {
      shortTerm: string[]
      longTerm: string[]
      dreams: string[]
      currentQuest?: string
    }
    traitsAdd: Record<string, string> // Additional traits (cannot override canonical)
  }

  // UI Configuration
  ui: {
    crystallizedKeys: string[] // Highlighted trait keys
    lockedKeys: string[] // Non-editable trait keys
    highlights?: string[] // Featured aspects
    theme?: string // UI theme preference
  }

  // Optional Capabilities
  capabilities?: {
    chat?: boolean
    posts?: boolean
  }

  // Additional Metadata
  meta?: {
    notes?: string
    version?: string
    [key: string]: any
  }
}

// Type guards and utilities
export function isAIMv2(obj: any): obj is AIMv2 {
  return obj && obj.version === "aim-2" && obj.id && obj.subject && obj.canonical
}

export function createEmptyAIMv2(id: string): AIMv2 {
  const now = new Date().toISOString()
  return {
    version: "aim-2",
    id,
    createdAt: now,
    updatedAt: now,
    subject: {
      chain: "",
      contract: "",
      tokenId: "",
      collectionName: "",
    },
    sources: {
      metadataUri: "",
      fetchedAt: now,
      metadataHash: "",
      image: "",
      openseaUrl: "",
    },
    canonical: {
      traits: {},
    },
    normalized: {
      traits: {},
    },
    persona: {
      title: "",
      tone: "",
      tags: [],
      lore: "",
      goals: {
        shortTerm: [],
        longTerm: [],
        dreams: [],
      },
      traitsAdd: {},
    },
    ui: {
      crystallizedKeys: [],
      lockedKeys: [],
    },
  }
}
