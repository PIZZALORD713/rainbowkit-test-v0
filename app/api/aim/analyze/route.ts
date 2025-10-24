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

const ANALYZER_SYSTEM_PROMPT = `You are an Ora identity analyst. Analyze NFT traits and image to suggest Avatar Identity Model fields.

Rules:
- Output JSON only: {patch, confidence} format
- Fill likely personality, backstory, abilities, behavior, and visuals fields
- Keep phrases concise (2-4 words max)
- No weapons or violence
- Style: solarpunk sci-fi, optimistic future
- Confidence scores: 0.1-1.0 based on trait clarity

Example output:
{
  "patch": {
    "personality": {
      "primary": ["curious", "adventurous"],
      "alignment": "Chaotic Good"
    },
    "abilities": {
      "strengths": ["quick thinking", "adaptable"]
    }
  },
  "confidence": {
    "personality.primary": 0.8,
    "personality.alignment": 0.6,
    "abilities.strengths": 0.7
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
      const prompt = `Analyze this Sugartown Ora NFT:
Traits: ${traitText}
${imageUrl ? `Image: ${imageUrl}` : ""}

Suggest Avatar Identity Model fields based on these traits.`

      console.log(`[v0] Calling OpenAI with prompt for Ora #${oraNumber}`)

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

      // Fall back to demo on API errors
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
