export const runtime = "nodejs" // avoid Edge for OpenAI SDK

import type { NextRequest } from "next/server"
import openai from "@/lib/openai"
import { getCache, setCache } from "@/lib/aim-cache"
import { createHash } from "node:crypto"
import { orakitMCPClient } from "@/lib/mcp-client"

type Trait = { key: string; value: string }
const toTraitArray = (t: Record<string, string> | Trait[]): Trait[] =>
  Array.isArray(t) ? t : Object.entries(t).map(([key, value]) => ({ key, value }))

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })

const AIM_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    patch: {
      type: "object",
      properties: {
        personality: {
          type: "object",
          properties: {
            primary: {
              type: "array",
              items: { type: "string" },
              description: "Primary personality traits (2-4 words each)",
            },
            alignment: {
              type: "string",
              description: "Moral alignment (e.g., Chaotic Good, Neutral)",
            },
          },
        },
        backstory: {
          type: "object",
          properties: {
            origin: { type: "string", description: "Character origin story" },
            motivation: { type: "string", description: "Primary motivation" },
          },
        },
        abilities: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "Character abilities and strengths",
            },
          },
        },
        behavior: {
          type: "object",
          properties: {
            quirks: {
              type: "array",
              items: { type: "string" },
              description: "Behavioral quirks and mannerisms",
            },
          },
        },
        visuals: {
          type: "object",
          properties: {
            palette: {
              type: "array",
              items: { type: "string" },
              description: "Color palette associated with character",
            },
            motifs: {
              type: "array",
              items: { type: "string" },
              description: "Visual motifs and symbols",
            },
          },
        },
      },
    },
    confidence: {
      type: "object",
      additionalProperties: {
        type: "number",
        minimum: 0.1,
        maximum: 1.0,
      },
      description: "Confidence scores for each suggested field",
    },
  },
  required: ["patch", "confidence"],
  additionalProperties: false,
}

const ANALYZER_SYSTEM_PROMPT = `You are an Ora identity analyst. Analyze NFT traits and image to suggest Avatar Identity Model fields.

Rules:
- Output JSON only: {patch, confidence} format
- Fill likely personality, backstory, abilities, behavior, and visuals fields
- Keep phrases concise (2-4 words max)
- No weapons or violence
- Style: solarpunk sci-fi, optimistic future
- Confidence scores: 0.1-1.0 based on trait clarity
- Include color palette and visual motifs when possible

Focus on creating engaging, positive character profiles that reflect the NFT's unique traits.`

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
    const previousResponseId = raw?.previous_response_id

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
      .update(`${oraNumber}-${traitText}-${imageUrl || ""}-${previousResponseId || ""}`)
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

    console.log(`[v0] Making OpenAI Responses API call for Ora #${oraNumber}`)

    try {
      const prompt = `Analyze this Sugartown Ora NFT:
Traits: ${traitText}

Suggest Avatar Identity Model fields based on these traits. Focus on the character's personality, backstory, abilities, behavior, and visual elements.`

      let input = [
        { role: "system" as const, content: ANALYZER_SYSTEM_PROMPT },
        {
          role: "user" as const,
          content: imageUrl
            ? [
                { type: "text" as const, text: prompt },
                { type: "image_url" as const, image_url: { url: imageUrl } },
              ]
            : prompt,
        },
      ]

      if (process.env.ORAKIT_MCP_SERVER_URL) {
        input = await orakitMCPClient.enhancePromptWithTools(input, ["opensea_get_ora"])
      }

      console.log(`[v0] Calling OpenAI Responses API with ${imageUrl ? "vision" : "text"} input for Ora #${oraNumber}`)

      const response = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: input,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "aim_analysis",
            schema: AIM_ANALYSIS_SCHEMA,
            strict: true,
          },
        },
        temperature: 0.7,
        max_tokens: 1500,
        ...(previousResponseId && { previous_response_id: previousResponseId }),
      })

      console.log(`[v0] OpenAI Responses API call successful for Ora #${oraNumber}`)

      const aiResponse = response.choices[0]?.message?.parsed
      if (!aiResponse) {
        throw new Error("No parsed content in OpenAI response")
      }

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
        response_id: response.id,
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
