export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { z } from "zod"

console.log("[v0] ======== ANALYZE ROUTE MODULE LOADING ========")

// Helper to create JSON responses
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })

const aimSuggestionSchema = z.object({
  patch: z.object({
    personality: z.object({
      primary: z.array(z.string()).describe("2-3 personality traits based on Ora characteristics"),
      alignment: z.enum([
        "Lawful Good",
        "Neutral Good",
        "Chaotic Good",
        "Lawful Neutral",
        "True Neutral",
        "Chaotic Neutral",
        "Lawful Evil",
        "Neutral Evil",
        "Chaotic Evil",
      ]),
    }),
    backstory: z.object({
      origin: z.string().describe("Brief origin story based on traits"),
      motivation: z.string().describe("What drives this Ora"),
    }),
    abilities: z.object({
      strengths: z.array(z.string()).describe("2-3 abilities based on traits"),
    }),
    behavior: z.object({
      quirks: z.array(z.string()).describe("2-3 behavioral quirks"),
    }),
    visuals: z.object({
      palette: z.array(z.string()).describe("3-5 hex color codes"),
      motifs: z.array(z.string()).describe("2-3 visual motifs"),
    }),
  }),
  confidence: z.object({
    "personality.primary": z.number().min(0).max(1),
    "personality.alignment": z.number().min(0).max(1),
    "backstory.origin": z.number().min(0).max(1),
    "backstory.motivation": z.number().min(0).max(1),
    "abilities.strengths": z.number().min(0).max(1),
    "behavior.quirks": z.number().min(0).max(1),
  }),
})

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
      visuals: {
        palette: ["#1a1a2e", "#16213e", "#0f3460"],
        motifs: ["shadows", "stars", "void"],
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
  light: {
    patch: {
      personality: {
        primary: ["radiant", "optimistic"],
        alignment: "Lawful Good",
      },
      backstory: {
        origin: "born from pure light",
        motivation: "spreading hope",
      },
      abilities: {
        strengths: ["illumination", "healing"],
      },
      behavior: {
        quirks: ["glows when happy", "hums softly"],
      },
      visuals: {
        palette: ["#fff9e6", "#ffe066", "#ffd43b"],
        motifs: ["rays", "halos", "sparkles"],
      },
    },
    confidence: {
      "personality.primary": 0.9,
      "personality.alignment": 0.8,
      "backstory.origin": 0.7,
      "backstory.motivation": 0.8,
      "abilities.strengths": 0.9,
      "behavior.quirks": 0.7,
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
      visuals: {
        palette: ["#e7f5ff", "#a5d8ff", "#74c0fc"],
        motifs: ["circuits", "data streams", "nodes"],
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

async function analyzeWithAI(oraNumber: number, traits: any[], imageUrl?: string): Promise<any> {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  console.log(`[v0] OpenAI API key available: ${hasApiKey}`)

  if (!hasApiKey) {
    console.log(`[v0] No OpenAI API key - using demo mode`)
    return { ...generateDemoResponse(traits), _demo: true, _reason: "No API key" }
  }

  try {
    console.log(`[v0] Calling AI SDK for Ora #${oraNumber}`)

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Build trait description
    const traitDesc = traits.map((t) => `${t.key || "unknown"}: ${t.value || "unknown"}`).join(", ")
    console.log(`[v0] Traits: ${traitDesc}`)

    const prompt = `You are an expert at creating AI Model (AIM) profiles for Sugartown Oras - unique digital collectibles with distinct traits.

Analyze this Ora's traits and suggest values for the AIM profile fields:
Traits: ${traitDesc}

Base your suggestions on the traits provided. Be creative but consistent with the Ora's characteristics. Provide confidence scores (0.0-1.0) for each field based on how well the traits support your suggestions.`

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: aimSuggestionSchema,
      prompt,
      temperature: 0.7,
    })

    console.log(`[v0] AI SDK response received successfully`)

    return {
      ...object,
      _demo: false,
      _message: "AI analysis complete",
    }
  } catch (error: any) {
    console.error(`[v0] AI SDK error:`, error)
    console.error(`[v0] Error message:`, error?.message)
    console.error(`[v0] Error stack:`, error?.stack)

    // Fallback to demo mode on error
    return {
      ...generateDemoResponse(traits),
      _demo: true,
      _reason: `AI error: ${error?.message || "Unknown error"}`,
    }
  }
}

export async function POST(request: NextRequest) {
  console.log(`[v0] ========================================`)
  console.log(`[v0] Analyze API route POST handler called`)
  console.log(`[v0] ========================================`)

  try {
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
    const traits = Array.isArray(raw?.traits)
      ? raw.traits
      : Object.entries(raw?.traits || {}).map(([key, value]) => ({ key, value }))

    console.log(`[v0] Processing Ora #${oraNumber} with ${traits.length} traits`)

    const result = await analyzeWithAI(oraNumber, traits, imageUrl)

    console.log(`[v0] Returning ${result._demo ? "demo" : "AI"} response for Ora #${oraNumber}`)

    return json(result)
  } catch (e: any) {
    console.error(`[v0] API error:`, e)
    console.error(`[v0] Error stack:`, e?.stack)

    return json(
      {
        error: "Internal server error",
        message: e?.message || "Unknown error",
        _demo: true,
      },
      500,
    )
  }
}

console.log("[v0] ======== ANALYZE ROUTE MODULE LOADED ========")
