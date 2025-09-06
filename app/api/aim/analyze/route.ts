export const runtime = "nodejs" // avoid Edge for OpenAI SDK

import type { NextRequest } from "next/server"
import { openai } from "@/lib/openai"
import { getCache, setCache } from "@/lib/aim-cache"
import { createHash } from "crypto"
import type { AIMDelta } from "@/types/aim"
import { z } from "zod"

const Body = z.object({
  oraNumber: z.number(),
  imageUrl: z.string().url().optional(),
  traits: z.union([z.array(z.object({ key: z.string(), value: z.string() })), z.record(z.string(), z.string())]),
})

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

const DEMO_RESPONSES: Record<string, AIMDelta> = {
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
  light: {
    patch: {
      personality: {
        primary: ["radiant", "optimistic"],
        alignment: "Lawful Good",
      },
      backstory: {
        origin: "born from pure energy",
        motivation: "illuminating darkness",
      },
      abilities: {
        strengths: ["healing light", "inspiration"],
      },
      behavior: {
        quirks: ["glows when happy", "hums melodically"],
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

function generateDemoResponse(traits: any[]): AIMDelta {
  const typeTraits = traits.filter((t) => t.key?.toLowerCase() === "type")
  const oraType = typeTraits[0]?.value?.toLowerCase() || "default"

  const baseResponse = DEMO_RESPONSES[oraType] || DEMO_RESPONSES.default

  // Add some randomization to make it feel more dynamic
  const variations = {
    void: ["enigmatic", "contemplative", "ethereal"],
    light: ["brilliant", "uplifting", "luminous"],
    default: ["inquisitive", "resourceful", "balanced"],
  }

  const variantTraits = variations[oraType as keyof typeof variations] || variations.default
  const randomTrait = variantTraits[Math.floor(Math.random() * variantTraits.length)]

  return {
    ...baseResponse,
    patch: {
      ...baseResponse.patch,
      personality: {
        ...baseResponse.patch.personality,
        primary: [randomTrait, ...(baseResponse.patch.personality?.primary || []).slice(1)],
      },
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log(`[v0] Starting analysis request`)

    const raw = await request.json().catch(() => null)
    if (!raw) {
      console.log(`[v0] Invalid JSON body`)
      return json({ error: "Invalid JSON body" }, 400)
    }

    const parsed = Body.safeParse(raw)
    if (!parsed.success) {
      console.log(`[v0] Body validation failed:`, parsed.error.format())
      return json({ error: "Invalid body", issues: parsed.error.format() }, 400)
    }

    const { oraNumber, imageUrl } = parsed.data
    const traits = toTraitArray(parsed.data.traits)
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

    const cacheKey = createHash("sha1").update(JSON.stringify({ traits, imageUrl })).digest("hex")

    const cachedResult = getCache(cacheKey)
    if (cachedResult) {
      console.log(`[v0] Cache hit for Ora #${oraNumber}`)
      return json({ ...cachedResult, _cached: true })
    }

    console.log(`[v0] Making OpenAI API call for Ora #${oraNumber}`)
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYZER_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ oraNumber, imageUrl, traits }) },
      ],
    })

    console.log(`[v0] OpenAI API call successful for Ora #${oraNumber}`)
    const content = resp.choices?.[0]?.message?.content ?? "{}"
    let data: any
    try {
      data = JSON.parse(content)
    } catch (parseError) {
      console.log(`[v0] JSON parse error for Ora #${oraNumber}:`, parseError)
      data = { patch: {}, confidence: {} }
    }

    if (!data.patch || !data.confidence) {
      console.log(`[v0] Invalid response structure for Ora #${oraNumber}, using defaults`)
      data = { patch: {}, confidence: {} }
    }

    setCache(cacheKey, data)
    console.log(`[v0] Analysis complete for Ora #${oraNumber}`)
    return json(data, 200)
  } catch (e: any) {
    console.error(`[v0] API error:`, e)
    const status = e?.status === 429 ? 429 : 500

    if (status === 500) {
      console.log(`[v0] Falling back to demo mode due to error`)
      const demoResponse = generateDemoResponse([])
      return json(
        {
          ...demoResponse,
          _demo: true,
          _message: "Service error - using demo analysis",
          _error: e?.message || "Unknown error",
        },
        200,
      ) // Return 200 instead of 500 to prevent client errors
    }

    return json(
      {
        error: e?.message || "Internal error",
        status,
        _demo: status === 429,
        _message: status === 429 ? "Rate limited - using demo analysis" : "Service error",
      },
      status,
    )
  }
}
