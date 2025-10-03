export const runtime = "nodejs" // avoid Edge for OpenAI SDK

import type { NextRequest } from "next/server"
import { getCache, setCache } from "@/lib/aim-cache"
import { createHash } from "node:crypto"

console.log("[v0] ======== ANALYZE ROUTE MODULE LOADING ========")
console.log("[v0] ======== ANALYZE ROUTE MODULE LOADED ========")

type Trait = { key: string; value: string }
const toTraitArray = (t: Record<string, string> | Trait[]): Trait[] =>
  Array.isArray(t) ? t : Object.entries(t).map(([key, value]) => ({ key, value }))

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })

const ANALYZER_SYSTEM_PROMPT = `You are an Ora identity analyst. Analyze NFT traits and image to suggest Avatar Identity Model fields.

Output JSON with this structure:
{
  "patch": {
    "personality": {
      "primary": ["trait1", "trait2"],
      "alignment": "alignment"
    },
    "backstory": {
      "origin": "origin story",
      "motivation": "motivation"
    },
    "abilities": {
      "strengths": ["ability1", "ability2"]
    },
    "behavior": {
      "quirks": ["quirk1", "quirk2"]
    },
    "visuals": {
      "palette": ["color1", "color2"],
      "motifs": ["motif1", "motif2"]
    }
  },
  "confidence": {
    "personality.primary": 0.8,
    "personality.alignment": 0.7
  }
}

Rules:
- Keep phrases concise (2-4 words max)
- No weapons or violence
- Style: solarpunk sci-fi, optimistic future
- Confidence scores: 0.1-1.0 based on trait clarity
- Include color palette and visual motifs when possible`

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

async function getOpenAIClient() {
  try {
    const { default: openai } = await import("@/lib/openai")
    return openai
  } catch (error) {
    console.error("[v0] Failed to load OpenAI client:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(`[v0] ========================================`)
    console.log(`[v0] Analyze API route started`)
    console.log(`[v0] ========================================`)

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

    const traitText = traits.map((t) => `${t.key}: ${t.value}`).join(", ")
    const cacheKey = createHash("sha256")
      .update(`${oraNumber}-${traitText}-${imageUrl || ""}`)
      .digest("hex")

    try {
      const cached = await getCache(cacheKey)
      if (cached) {
        console.log(`[v0] Using cached analysis for Ora #${oraNumber}`)
        return json({
          ...cached,
          _demo: false,
          _cached: true,
          _message: "Cached AI analysis",
        })
      }
    } catch (cacheError) {
      console.log(`[v0] Cache read failed, proceeding with API call:`, cacheError)
    }

    console.log(`[v0] Making OpenAI API call for Ora #${oraNumber}`)

    const openai = await getOpenAIClient()
    if (!openai) {
      console.log(`[v0] OpenAI client not available, falling back to demo`)
      const demoResponse = generateDemoResponse(traits)
      return json({
        ...demoResponse,
        _demo: true,
        _message: "OpenAI unavailable - using demo",
      })
    }

    try {
      const prompt = `Analyze this Sugartown Ora NFT:
Traits: ${traitText}

Suggest Avatar Identity Model fields based on these traits. Focus on the character's personality, backstory, abilities, behavior, and visual elements.`

      const messages: any[] = [
        { role: "system", content: ANALYZER_SYSTEM_PROMPT },
        {
          role: "user",
          content: imageUrl
            ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ]
            : prompt,
        },
      ]

      console.log(`[v0] Calling OpenAI API with ${imageUrl ? "vision" : "text"} input for Ora #${oraNumber}`)

      const response = await openai.chat.completions.create({
        model: imageUrl ? "gpt-4o-mini" : "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500,
      })

      console.log(`[v0] OpenAI API call successful for Ora #${oraNumber}`)

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No content in OpenAI response")
      }

      const aiResponse = JSON.parse(content)

      try {
        await setCache(cacheKey, aiResponse)
        console.log(`[v0] Cached analysis for Ora #${oraNumber}`)
      } catch (cacheError) {
        console.log(`[v0] Cache write failed:`, cacheError)
      }

      return json({
        ...aiResponse,
        _demo: false,
        _message: "AI analysis complete",
      })
    } catch (apiError: any) {
      console.error(`[v0] OpenAI API error:`, apiError)
      console.error(`[v0] Error details:`, apiError?.message, apiError?.stack)

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
