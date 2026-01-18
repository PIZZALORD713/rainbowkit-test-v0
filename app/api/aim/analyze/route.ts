export const runtime = "nodejs" // avoid Edge for OpenAI SDK

import type { NextRequest } from "next/server"

let openai: any
let getCache: any
let setCache: any

try {
  console.log("[v0] Loading openai...")
  const openaiModule = await import("@/lib/openai")
  openai = openaiModule.openai
  console.log("[v0] OpenAI loaded successfully")
} catch (e) {
  console.error("[v0] Failed to load openai:", e)
}

try {
  console.log("[v0] Loading cache...")
  const cacheModule = await import("@/lib/aim-cache")
  getCache = cacheModule.getCache
  setCache = cacheModule.setCache
  console.log("[v0] Cache loaded successfully")
} catch (e) {
  console.error("[v0] Failed to load cache:", e)
}

type Trait = { key: string; value: string }
const toTraitArray = (t: Record<string, string> | Trait[]): Trait[] =>
  Array.isArray(t) ? t : Object.entries(t).map(([key, value]) => ({ key, value }))

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })

const ANALYZER_SYSTEM_PROMPT = `You are an Ora identity analyst for the Sugartown NFT collection. Analyze NFT traits and suggest Avatar Identity Model (AIM) fields.

Your task:
1. Examine the Ora's visual traits (Type, Background, Eyes, Special features, etc.)
2. Infer personality, backstory, abilities, and behavioral patterns
3. Create a cohesive character identity that fits the solarpunk sci-fi aesthetic

Output Format (JSON only):
{
  "patch": {
    "personality": {
      "primary": ["trait1", "trait2"],  // 2-4 core personality traits
      "secondary": ["trait3"],          // 1-2 supporting traits (optional)
      "alignment": "Alignment Name"     // D&D-style alignment
    },
    "backstory": {
      "origin": "brief origin story",   // 1-2 sentences
      "beats": ["event1", "event2"]     // 2-3 formative events (optional)
    },
    "abilities": {
      "strengths": ["strength1", "strength2"],  // 2-4 strengths
      "weaknesses": ["weakness1"]               // 1-2 weaknesses (optional)
    },
    "behavior": {
      "speech": "speech pattern description",   // How they talk
      "mannerisms": ["quirk1", "quirk2"]       // 1-3 behavioral quirks (optional)
    },
    "visuals": {
      "motifs": ["motif1", "motif2"]  // Visual themes/symbols (optional)
    }
  },
  "confidence": {
    "personality.primary": 0.85,      // 0.0-1.0 confidence for each field
    "personality.alignment": 0.70,
    "backstory.origin": 0.65,
    "abilities.strengths": 0.80,
    "behavior.speech": 0.60
  }
}

Guidelines:
- Keep all text concise (2-5 words per item, 1-2 sentences for origin)
- Base suggestions on visual traits (e.g., Void type = mysterious, Fire type = passionate)
- Confidence scores: 0.8+ for direct trait inference, 0.5-0.7 for creative interpretation, <0.5 for speculation
- Style: optimistic solarpunk sci-fi, no violence or weapons
- Alignments: Lawful/Neutral/Chaotic + Good/Neutral/Evil (e.g., "Chaotic Good")
- Make the character feel unique and memorable

Example for a Void-type Ora with glowing eyes:
{
  "patch": {
    "personality": {
      "primary": ["mysterious", "observant", "introspective"],
      "alignment": "Neutral"
    },
    "backstory": {
      "origin": "Emerged from the digital void, seeking connection in the physical realm."
    },
    "abilities": {
      "strengths": ["shadow manipulation", "heightened perception", "stealth"]
    },
    "behavior": {
      "speech": "speaks softly with long pauses",
      "mannerisms": ["avoids direct eye contact", "prefers dim lighting"]
    }
  },
  "confidence": {
    "personality.primary": 0.85,
    "personality.alignment": 0.75,
    "backstory.origin": 0.70,
    "abilities.strengths": 0.80,
    "behavior.speech": 0.65,
    "behavior.mannerisms": 0.60
  }
}`

const DEMO_RESPONSES: Record<string, any> = {
  void: {
    patch: {
      personality: {
        primary: ["mysterious", "introspective"],
        alignment: "Neutral",
      },
      backstory: {
        origin: "emerged from digital void",
        motivation: "seeking connection",
      },
      abilities: {
        strengths: ["shadow manipulation", "stealth"],
      },
      behavior: {
        quirks: ["speaks in whispers", "avoids bright lights"],
      },
    },
    confidence: {
      "personality.primary": 0.8,
      "personality.alignment": 0.7,
      "backstory.origin": 0.6,
      "backstory.motivation": 0.7,
      "abilities.strengths": 0.8,
      "behavior.quirks": 0.6,
    },
  },
  default: {
    patch: {
      personality: {
        primary: ["curious", "adaptable"],
        alignment: "Neutral Good",
      },
      backstory: {
        origin: "digital realm wanderer",
        motivation: "exploring possibilities",
      },
      abilities: {
        strengths: ["quick learning", "versatility"],
      },
      behavior: {
        quirks: ["tilts head when thinking", "collects data fragments"],
      },
    },
    confidence: {
      "personality.primary": 0.7,
      "personality.alignment": 0.6,
      "backstory.origin": 0.5,
      "backstory.motivation": 0.6,
      "abilities.strengths": 0.7,
      "behavior.quirks": 0.5,
    },
  },
}

function generateDemoResponse(traits: any[]): any {
  const typeTraits = traits.filter((t) => t.key?.toLowerCase() === "type")
  const oraType = typeTraits[0]?.value?.toLowerCase() || "default"
  return DEMO_RESPONSES[oraType] || DEMO_RESPONSES.default
}

export async function POST(request: NextRequest) {
  try {
    console.log(`[v0] API route started`)

    let raw: any
    try {
      raw = await request.json()
      console.log(`[v0] Request JSON parsed successfully`)
    } catch (e) {
      console.error(`[v0] Failed to parse JSON:`, e)
      return json({ error: "Invalid JSON body" }, 400)
    }

    const oraNumber = raw?.oraNumber || 0
    const imageUrl = raw?.imageUrl
    const traits = toTraitArray(raw?.traits || {})

    console.log(`[v0] Processing Ora #${oraNumber} with ${traits.length} traits`)

    const useDemo = !process.env.OPENAI_API_KEY || process.env.ORAKIT_DEMO_MODE === "true"

    if (useDemo) {
      console.log(`[v0] Using demo mode for Ora #${oraNumber}`)
      const demoResponse = generateDemoResponse(traits)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      return json({
        ...demoResponse,
        _demo: true,
        _message: "Demo mode - AI analysis simulated",
      })
    }

    console.log(`[v0] Making OpenAI API call for Ora #${oraNumber}`)

    if (!openai) {
      console.error(`[v0] OpenAI client not available`)
      const demoResponse = generateDemoResponse(traits)
      return json({
        ...demoResponse,
        _demo: true,
        _message: "OpenAI client unavailable - using demo",
      })
    }

    try {
      const traitText = traits.map((t) => `${t.key}: ${t.value}`).join(", ")

      const prompt = `Analyze this Sugartown Ora NFT and suggest character identity fields:

Ora #${oraNumber}
Traits: ${traitText}
${imageUrl ? `Image URL: ${imageUrl}` : ""}

Context: Sugartown Oras are digital beings in a solarpunk future. Each has unique traits that hint at their personality and abilities. Create a cohesive character identity based on these visual traits.`

      console.log(`[v0] Calling OpenAI with enhanced prompt for Ora #${oraNumber}`)

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ANALYZER_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      })

      console.log(`[v0] OpenAI API call successful for Ora #${oraNumber}`)

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No content in OpenAI response")
      }

      let aiResponse
      try {
        aiResponse = JSON.parse(content)
      } catch (e) {
        console.error(`[v0] Failed to parse OpenAI JSON response:`, e)
        throw new Error("Invalid JSON from OpenAI")
      }

      return json({
        ...aiResponse,
        _demo: false,
        _message: "AI analysis complete",
      })
    } catch (apiError: any) {
      console.error(`[v0] OpenAI API error:`, apiError)

      const demoResponse = generateDemoResponse(traits)
      return json({
        ...demoResponse,
        _demo: true,
        _message: `OpenAI API error: ${apiError.message} - using demo`,
      })
    }
  } catch (e: any) {
    console.error(`[v0] API error:`, e)
    console.error(`[v0] Error stack:`, e?.stack)

    const demoResponse = generateDemoResponse([])
    return json(
      {
        ...demoResponse,
        _demo: true,
        _message: "Error fallback - using demo analysis",
        _error: e?.message || "Unknown error",
      },
      200,
    )
  }
}
