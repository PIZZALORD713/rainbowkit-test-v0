# AIM v2 System Documentation

## Overview

The Avatar Identity Model (AIM) v2 system is a comprehensive character management framework for NFT collections that separates canonical blockchain data from user-defined persona customizations. This document outlines the architecture, data layers, migration process, and implementation guidelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Layers](#data-layers)
3. [Precedence Rules](#precedence-rules)
4. [Trait Normalization](#trait-normalization)
5. [UI Design Guidelines](#ui-design-guidelines)
6. [Migration from v1](#migration-from-v1)
7. [API Reference](#api-reference)
8. [Example AIM v2 Object](#example-aim-v2-object)
9. [Testing Guidelines](#testing-guidelines)

## Architecture Overview

AIM v2 introduces a structured approach to character data management with clear separation of concerns:

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Canonical     │    │   Normalized    │    │     Persona     │
│  (Immutable)    │───▶│   (Processed)   │───▶│   (Editable)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NFT Metadata  │    │ Conflict Detection│    │ User Customization│
│   Blockchain    │    │ Registry Mapping │    │ Additional Traits │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

### Key Components

- **Subject**: NFT identification (chain, contract, tokenId)
- **Sources**: Data provenance and metadata tracking
- **Canonical**: Immutable traits from NFT metadata
- **Normalized**: Processed canonical data with conflict resolution
- **Persona**: User-defined character customizations
- **UI**: Interface configuration and crystallized traits

## Data Layers

### 1. Subject Layer
Identifies the NFT and its blockchain context:

\`\`\`typescript
subject: {
  chain: string          // "ethereum", "polygon", etc.
  contract: string       // Contract address
  tokenId: string        // Token identifier
  owner?: string         // Current owner address
  collectionName: string // Human-readable collection name
}
\`\`\`

### 2. Sources Layer
Tracks data provenance and metadata:

\`\`\`typescript
sources: {
  metadataUri: string    // Original metadata URI
  fetchedAt: string      // ISO timestamp of last fetch
  metadataHash: string   // Hash of original metadata
  image: string          // NFT image URL
  openseaUrl: string     // OpenSea marketplace URL
}
\`\`\`

### 3. Canonical Layer
Immutable traits from NFT metadata:

\`\`\`typescript
canonical: {
  traits: Record<string, string>  // Original NFT traits
  raw?: any                       // Complete original metadata
}
\`\`\`

### 4. Normalized Layer
Processed canonical data with conflict resolution:

\`\`\`typescript
normalized: {
  traits: Record<string, string>  // Normalized trait keys/values
  registryVersion?: string        // Normalization registry version
  conflicts?: string[]            // List of conflicting trait keys
}
\`\`\`

### 5. Persona Layer
User-defined character customizations:

\`\`\`typescript
persona: {
  title: string                   // Character name/title
  nickname?: string               // Optional nickname
  alignment?: AlignmentType       // D&D-style alignment
  tone: string                    // Personality description
  tags: string[]                  // User-defined tags
  lore: string                    // Backstory and character history
  goals: {                        // Character objectives
    shortTerm: string[]
    longTerm: string[]
    dreams: string[]
    currentQuest?: string
  }
  traitsAdd: Record<string, string> // Additional traits (cannot override canonical)
}
\`\`\`

### 6. UI Layer
Interface configuration and visual preferences:

\`\`\`typescript
ui: {
  crystallizedKeys: string[]      // Highlighted important traits
  lockedKeys: string[]           // Non-editable trait keys
  highlights?: string[]          // Featured character aspects
  theme?: string                 // UI theme preference
}
\`\`\`

## Precedence Rules

The AIM v2 system enforces strict precedence rules to maintain data integrity:

### 1. Canonical Traits Cannot Be Overwritten
- Traits in `canonical.traits` are immutable
- `persona.traitsAdd` cannot contain keys that exist in `canonical.traits`
- Conflicts are automatically detected and recorded in `normalized.conflicts`

### 2. Trait Resolution Order
1. **Canonical traits** (highest priority)
2. **Normalized traits** (processed canonical)
3. **Persona additional traits** (lowest priority)

### 3. Conflict Handling
\`\`\`typescript
// Example conflict detection
const canonicalKeys = Object.keys(aimFile.canonical.traits)
const personaKeys = Object.keys(aimFile.persona.traitsAdd)
const conflicts = personaKeys.filter(key => canonicalKeys.includes(key))

if (conflicts.length > 0) {
  aimFile.normalized.conflicts = conflicts
  // Remove conflicting keys from persona.traitsAdd
  conflicts.forEach(key => delete aimFile.persona.traitsAdd[key])
}
\`\`\`

## Trait Normalization

### Registry System
Trait normalization uses a registry-based approach for consistent data processing:

\`\`\`typescript
interface TraitRegistry {
  version: string
  mappings: {
    [originalKey: string]: {
      normalizedKey: string
      valueTransforms?: {
        [originalValue: string]: string
      }
    }
  }
}
\`\`\`

### Normalization Process
1. **Key Normalization**: Convert trait keys to lowercase with underscores
2. **Value Standardization**: Apply registry-based value transformations
3. **Conflict Detection**: Identify overlapping keys between layers
4. **Registry Versioning**: Track normalization schema versions

### Example Normalization
\`\`\`typescript
// Original NFT traits
const original = {
  "Face Accessory": "Sunglasses",
  "Background": "Blue Sky"
}

// Normalized traits
const normalized = {
  "face_accessory": "Sunglasses",
  "background": "Blue Sky"
}
\`\`\`

## UI Design Guidelines

### Locked vs. Editable Sections

#### Canonical Traits Section (Read-Only)
- **Visual Indicators**: Lock icons, muted colors
- **Crystallized Badges**: Sparkle icons for important traits
- **Information Display**: Show trait source and immutability
- **Layout**: Grid or list format with clear visual hierarchy

#### Persona Section (Editable)
- **Form Controls**: Input fields, textareas, selectors
- **Validation**: Real-time conflict detection
- **Visual Feedback**: Error states for trait conflicts
- **Save Indicators**: Clear save/unsaved state communication

### Crystallized Traits
Crystallized traits are visually highlighted to indicate importance:

\`\`\`typescript
// UI implementation
{aimFile.ui.crystallizedKeys.map(key => (
  <Badge className="bg-amber-500 text-white">
    <Sparkles className="w-3 h-3 mr-1" />
    {key.replace(/_/g, " ")}
  </Badge>
))}
\`\`\`

### Design Patterns
- **Color Coding**: Different colors for canonical vs. persona traits
- **Progressive Disclosure**: Collapsible sections for complex data
- **Contextual Help**: Tooltips explaining trait precedence
- **Batch Operations**: Multi-select for bulk trait management

## Migration from v1

### Automatic Migration Process

The migration system converts legacy AIM v1 files to v2 format:

\`\`\`typescript
const migrationResult = AIMMigration.migrateV1ToV2(v1File, {
  preserveOriginalId: false,
  defaultChain: "ethereum",
  defaultContract: "unknown",
  generateTokenId: true
})
\`\`\`

### Field Mapping

| AIM v1 Field | AIM v2 Field | Notes |
|--------------|--------------|-------|
| `characterName` | `persona.title` | Direct mapping |
| `personality.temperament` | `persona.tone` | Personality description |
| `backstory.*` | `persona.lore` | Concatenated backstory fields |
| `behavior.socialStyle` | `persona.traitsAdd.social_style` | Additional trait |
| `notes` | `meta.notes` | Metadata field |
| `tags` | `persona.tags` | Direct array mapping |
| `goals` | `persona.goals` | Direct object mapping |

### Migration Warnings
The migration process generates warnings for:
- Missing personality temperament data
- Limited backstory information
- Incomplete character profiles
- Data that cannot be perfectly mapped

### Post-Migration Cleanup
After migration, users should:
1. Review and enhance persona data
2. Set crystallized traits for important characteristics
3. Add canonical traits from NFT metadata
4. Verify trait conflicts are resolved

## API Reference

### Storage Operations

#### AIMStorage.saveV2(aimFile: AIMv2)
Saves an AIM v2 file with automatic versioning and timestamp updates.

#### AIMStorage.getAllV2(): AIMv2[]
Retrieves all AIM v2 files from storage.

#### AIMStorage.getV2BySubject(chain, contract, tokenId): AIMv2 | null
Finds AIM v2 file by NFT subject information.

### Migration Operations

#### AIMMigration.migrateV1ToV2(v1File, options): MigrationResult
Converts AIM v1 file to v2 format with configurable options.

#### AIMMigration.validateTraitsAdd(canonical, traitsAdd): string[]
Validates persona traits against canonical traits, returns conflicts.

#### AIMMigration.resolveTraitConflicts(canonical, traitsAdd)
Removes conflicting traits and returns clean data.

### Utility Functions

#### isAIMv2(file): boolean
Type guard to determine if file is AIM v2 format.

#### createEmptyAIMv2(id): AIMv2
Creates a new empty AIM v2 file with default structure.

## Example AIM v2 Object

\`\`\`json
{
  "version": "aim-2",
  "id": "aim-v2-1234-1640995200000",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T15:45:00.000Z",
  
  "subject": {
    "chain": "ethereum",
    "contract": "0x1234567890abcdef",
    "tokenId": "1234",
    "owner": "0xabcdef1234567890",
    "collectionName": "Sugartown Oras"
  },
  
  "sources": {
    "metadataUri": "https://api.example.com/metadata/1234",
    "fetchedAt": "2024-01-15T10:30:00.000Z",
    "metadataHash": "0xabcdef123456",
    "image": "https://images.example.com/1234.png",
    "openseaUrl": "https://opensea.io/assets/ethereum/0x1234567890abcdef/1234"
  },
  
  "canonical": {
    "traits": {
      "background": "Sunset",
      "eyes": "Blue",
      "clothing": "Hoodie",
      "accessory": "Headphones"
    },
    "raw": {
      "name": "Ora #1234",
      "description": "A unique Sugartown Ora",
      "attributes": [
        {"trait_type": "Background", "value": "Sunset"},
        {"trait_type": "Eyes", "value": "Blue"},
        {"trait_type": "Clothing", "value": "Hoodie"},
        {"trait_type": "Accessory", "value": "Headphones"}
      ]
    }
  },
  
  "normalized": {
    "traits": {
      "background": "Sunset",
      "eyes": "Blue", 
      "clothing": "Hoodie",
      "accessory": "Headphones"
    },
    "registryVersion": "1.0",
    "conflicts": []
  },
  
  "persona": {
    "title": "Echo the Dreamer",
    "nickname": "Echo",
    "alignment": "Chaotic Good",
    "tone": "Optimistic and creative, always looking for new adventures",
    "tags": ["musician", "dreamer", "adventurer"],
    "lore": "Echo discovered their love for music during the great sunset of Sugartown. With their trusty headphones, they explore the digital realms seeking new sounds and experiences.",
    "goals": {
      "shortTerm": ["Master the new synthesizer", "Perform at the Digital Festival"],
      "longTerm": ["Create a revolutionary music genre", "Build a community of digital musicians"],
      "dreams": ["Unite all realms through music", "Discover the source of the eternal sunset"],
      "currentQuest": "Finding the lost melody of the ancients"
    },
    "traitsAdd": {
      "instrument": "Synthesizer",
      "favorite_color": "Purple",
      "personality_type": "ENFP"
    }
  },
  
  "ui": {
    "crystallizedKeys": ["eyes", "accessory", "instrument"],
    "lockedKeys": ["background", "eyes", "clothing", "accessory"],
    "highlights": ["Musical abilities", "Sunset connection", "Creative spirit"],
    "theme": "sunset"
  },
  
  "capabilities": {
    "chat": true,
    "posts": false
  },
  
  "meta": {
    "notes": "Character inspired by the eternal sunset theme",
    "version": "2.1",
    "migratedFrom": "aim-v1",
    "migrationDate": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

## Testing Guidelines

### Unit Tests

#### Type Validation
\`\`\`typescript
describe('AIM v2 Type Validation', () => {
  test('should validate AIM v2 structure', () => {
    const aimFile = createEmptyAIMv2('test-id')
    expect(isAIMv2(aimFile)).toBe(true)
    expect(aimFile.version).toBe('aim-2')
  })
})
\`\`\`

#### Migration Testing
\`\`\`typescript
describe('Migration from v1 to v2', () => {
  test('should migrate v1 file successfully', () => {
    const v1File = createMockV1File()
    const result = AIMMigration.migrateV1ToV2(v1File)
    
    expect(result.success).toBe(true)
    expect(result.aimv2?.persona.title).toBe(v1File.characterName)
    expect(result.errors).toHaveLength(0)
  })
  
  test('should detect trait conflicts', () => {
    const canonical = { background: 'Blue' }
    const traitsAdd = { background: 'Red', eyes: 'Green' }
    const conflicts = AIMMigration.validateTraitsAdd(canonical, traitsAdd)
    
    expect(conflicts).toContain('background')
    expect(conflicts).not.toContain('eyes')
  })
})
\`\`\`

#### Storage Testing
\`\`\`typescript
describe('AIM v2 Storage', () => {
  test('should save and retrieve v2 files', () => {
    const aimFile = createEmptyAIMv2('test-id')
    AIMStorage.saveV2(aimFile)
    
    const retrieved = AIMStorage.getV2ById('test-id')
    expect(retrieved).toEqual(aimFile)
  })
})
\`\`\`

### Integration Tests

#### End-to-End Workflow
1. Create new AIM v2 file
2. Add canonical traits from NFT metadata
3. Customize persona data
4. Validate trait conflicts
5. Save and retrieve file
6. Export and import file
7. Migrate legacy v1 file

#### UI Component Testing
- Test canonical traits display (read-only)
- Test persona editing functionality
- Test crystallized trait highlighting
- Test conflict detection and error display
- Test migration workflow UI

### Performance Testing

#### Large Dataset Handling
- Test with 1000+ AIM files
- Measure search and filter performance
- Validate memory usage during bulk operations
- Test concurrent read/write operations

#### Migration Performance
- Benchmark v1 to v2 migration speed
- Test batch migration of multiple files
- Validate data integrity after migration

## Conclusion

The AIM v2 system provides a robust, scalable architecture for NFT character management with clear separation between immutable blockchain data and user customizations. The structured approach ensures data integrity while providing flexibility for creative character development.

For implementation questions or feature requests, please refer to the codebase documentation or create an issue in the project repository.

---

*Last Updated: January 2024*
*Version: 2.0*
