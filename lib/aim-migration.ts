import type { AIMFile, AIMv2 } from "@/types/aim"
import { createEmptyAIMv2 } from "@/types/aim-v2"

export interface MigrationResult {
  success: boolean
  aimv2?: AIMv2
  errors: string[]
  warnings: string[]
}

export interface MigrationOptions {
  preserveOriginalId?: boolean
  defaultChain?: string
  defaultContract?: string
  generateTokenId?: boolean
}

/**
 * Migration helper that converts legacy AIM files (v1) to v2 format
 * Maps characterName → persona.title, personality → persona.tone, etc.
 */
export class AIMMigration {
  /**
   * Convert a legacy AIMFile (v1) to AIMv2 format
   */
  static migrateV1ToV2(v1File: AIMFile, options: MigrationOptions = {}): MigrationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Create base v2 structure
      const v2File = createEmptyAIMv2(options.preserveOriginalId ? v1File.id : `migrated-${v1File.id}`)

      // Preserve timestamps
      v2File.createdAt = v1File.createdAt
      v2File.updatedAt = v1File.updatedAt || new Date().toISOString()

      // Map subject information from v1 fields
      v2File.subject = {
        chain: options.defaultChain || "ethereum",
        contract: options.defaultContract || "unknown",
        tokenId: options.generateTokenId ? v1File.oraNumber : v1File.oraNumber,
        owner: undefined, // Not available in v1
        collectionName: v1File.oraName || "Unknown Collection",
      }

      // Map sources information
      v2File.sources = {
        metadataUri: "", // Not available in v1
        fetchedAt: v1File.createdAt,
        metadataHash: "", // Not available in v1
        image: v1File.oraImage || "",
        openseaUrl: "", // Not available in v1
      }

      // Leave canonical.traits empty if metadata isn't available (as specified)
      v2File.canonical = {
        traits: {},
        raw: undefined,
      }

      // Initialize normalized traits (empty since no canonical data)
      v2File.normalized = {
        traits: {},
        conflicts: [],
      }

      // Map core character data to persona
      v2File.persona = {
        title: v1File.characterName, // characterName → persona.title
        nickname: v1File.nickname,
        alignment: v1File.personality?.alignment, // personality → persona.alignment
        tone: v1File.personality?.temperament || "", // personality → persona.tone
        tags: v1File.tags || [],
        lore: this.buildLoreFromV1(v1File), // backstory → persona.lore
        goals: v1File.goals || {
          shortTerm: [],
          longTerm: [],
          dreams: [],
        },
        traitsAdd: this.extractTraitsFromV1(v1File), // Additional traits from v1 data
      }

      // Set up UI configuration
      v2File.ui = {
        crystallizedKeys: this.suggestCrystallizedKeys(v1File),
        lockedKeys: [], // No locked keys for migrated files
        highlights: v1File.personality?.primaryTraits?.slice(0, 3), // Highlight primary traits
        theme: undefined,
      }

      // Map metadata
      v2File.meta = {
        notes: v1File.notes, // notes → meta.notes
        version: v1File.version,
        migratedFrom: "aim-v1",
        migrationDate: new Date().toISOString(),
      }

      // Add warnings for data that couldn't be perfectly mapped
      if (!v1File.personality?.temperament) {
        warnings.push("No personality temperament found, persona.tone will be empty")
      }

      if (!v1File.backstory?.origin && !v1File.backstory?.childhood) {
        warnings.push("Limited backstory data available for persona.lore")
      }

      return {
        success: true,
        aimv2: v2File,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      return {
        success: false,
        errors,
        warnings,
      }
    }
  }

  /**
   * Build lore text from v1 backstory data
   */
  private static buildLoreFromV1(v1File: AIMFile): string {
    const loreParts: string[] = []

    if (v1File.backstory?.origin) {
      loreParts.push(`Origin: ${v1File.backstory.origin}`)
    }

    if (v1File.backstory?.childhood) {
      loreParts.push(`Childhood: ${v1File.backstory.childhood}`)
    }

    if (v1File.backstory?.formativeEvents?.length) {
      loreParts.push(`Key Events: ${v1File.backstory.formativeEvents.join(", ")}`)
    }

    if (v1File.behavior?.speechPatterns) {
      loreParts.push(`Speech: ${v1File.behavior.speechPatterns}`)
    }

    if (v1File.appearance?.distinctiveFeatures?.length) {
      loreParts.push(`Appearance: ${v1File.appearance.distinctiveFeatures.join(", ")}`)
    }

    return loreParts.join("\n\n") || ""
  }

  /**
   * Extract additional traits from v1 data for traitsAdd
   */
  private static extractTraitsFromV1(v1File: AIMFile): Record<string, string> {
    const traits: Record<string, string> = {}

    // Add personality traits
    if (v1File.personality?.primaryTraits?.length) {
      traits.primary_traits = v1File.personality.primaryTraits.join(", ")
    }

    if (v1File.personality?.secondaryTraits?.length) {
      traits.secondary_traits = v1File.personality.secondaryTraits.join(", ")
    }

    // Add abilities
    if (v1File.abilities?.strengths?.length) {
      traits.strengths = v1File.abilities.strengths.join(", ")
    }

    if (v1File.abilities?.specialPowers?.length) {
      traits.special_powers = v1File.abilities.specialPowers.join(", ")
    }

    // Add behavioral info
    if (v1File.behavior?.socialStyle) {
      traits.social_style = v1File.behavior.socialStyle
    }

    // Add physical traits
    if (v1File.appearance?.height) {
      traits.height = v1File.appearance.height
    }

    if (v1File.appearance?.build) {
      traits.build = v1File.appearance.build
    }

    return traits
  }

  /**
   * Suggest crystallized keys based on v1 data
   */
  private static suggestCrystallizedKeys(v1File: AIMFile): string[] {
    const keys: string[] = []

    // Crystallize primary traits
    if (v1File.personality?.primaryTraits?.length) {
      keys.push("primary_traits")
    }

    // Crystallize special abilities
    if (v1File.abilities?.specialPowers?.length) {
      keys.push("special_powers")
    }

    // Crystallize alignment if present
    if (v1File.personality?.alignment) {
      keys.push("alignment")
    }

    return keys
  }

  /**
   * Validate that persona.traitsAdd doesn't conflict with canonical.traits
   * Returns conflicts that should be recorded in normalized.conflicts
   */
  static validateTraitsAdd(canonicalTraits: Record<string, string>, traitsAdd: Record<string, string>): string[] {
    const conflicts: string[] = []

    for (const key in traitsAdd) {
      if (key in canonicalTraits) {
        conflicts.push(key)
      }
    }

    return conflicts
  }

  /**
   * Remove conflicting traits from traitsAdd and record conflicts
   */
  static resolveTraitConflicts(
    canonicalTraits: Record<string, string>,
    traitsAdd: Record<string, string>,
  ): { cleanTraitsAdd: Record<string, string>; conflicts: string[] } {
    const conflicts = this.validateTraitsAdd(canonicalTraits, traitsAdd)
    const cleanTraitsAdd = { ...traitsAdd }

    // Remove conflicting keys from traitsAdd
    for (const conflictKey of conflicts) {
      delete cleanTraitsAdd[conflictKey]
    }

    return { cleanTraitsAdd, conflicts }
  }

  /**
   * Batch migrate multiple v1 files
   */
  static batchMigrateV1ToV2(
    v1Files: AIMFile[],
    options: MigrationOptions = {},
  ): { results: MigrationResult[]; summary: { success: number; failed: number } } {
    const results: MigrationResult[] = []
    let successCount = 0
    let failedCount = 0

    for (const v1File of v1Files) {
      const result = this.migrateV1ToV2(v1File, options)
      results.push(result)

      if (result.success) {
        successCount++
      } else {
        failedCount++
      }
    }

    return {
      results,
      summary: {
        success: successCount,
        failed: failedCount,
      },
    }
  }
}
