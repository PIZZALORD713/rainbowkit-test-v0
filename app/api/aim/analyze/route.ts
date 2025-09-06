import { type NextRequest, NextResponse } from "next/server"
import { chat } from "@/lib/openai"
import type { AIMDelta } from "@/types/aim"

const ANALYZER_SYSTEM_PROMPT = `You are an Ora identity analyst. Analyze NFT traits and image to suggest Avatar Identity Model fields.

Rules:
- Output JSON only: AIMDelta format
- Fill likely personality, backstory, abilities, behavior, and visuals fields
- Keep phrases concise (2-4 words max)
- Respect any existing visuals.doNotChange array
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
  const typeTraits = traits.filter((t) => t.trait_type?.toLowerCase() === "type")
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
  let requestData: { oraNumber: string; traits: any[]; imageUrl?: string }

  try {
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { oraNumber, traits, imageUrl } = requestData

    if (!oraNumber || !traits) {
      return NextResponse.json({ error: "Missing required fields: oraNumber, traits" }, { status: 400 })
    }

    const useDemo = !process.env.OPENAI_API_KEY || process.env.ORAKIT_DEMO_MODE === "true"

    if (useDemo) {
      console.log(`[v0] Using demo mode for Ora #${oraNumber}`)
      const demoResponse = generateDemoResponse(traits)

      // Add a small delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

      return NextResponse.json({
        ...demoResponse,
        _demo: true,
        _message: "Demo mode - AI analysis simulated",
      })
    }

    // Check rate limiting (simple in-memory cache for demo)
    const cacheKey = `analyze_${oraNumber}_${JSON.stringify(traits)}`

    const userPrompt = `Analyze Ora #${oraNumber}:
Traits: ${JSON.stringify(traits, null, 2)}
${imageUrl ? `Image: ${imageUrl}` : ""}

Generate AIM suggestions based on these traits.`

    try {
      const response = await chat(
        [
          { role: "system", content: ANALYZER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        {
          temperature: 0.7,
          max_tokens: 800,
        },
      )

      // Parse JSON response
      let aimDelta: AIMDelta
      try {
        aimDelta = JSON.parse(response)
      } catch (parseError) {
        console.error("Failed to parse AI response:", response)
        console.log(`[v0] AI response parse failed, falling back to demo mode for Ora #${oraNumber}`)
        const demoResponse = generateDemoResponse(traits)
        return NextResponse.json({
          ...demoResponse,
          _demo: true,
          _message: "AI response invalid - using demo analysis",
        })
      }

      return NextResponse.json(aimDelta)
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)

      console.log(`[v0] OpenAI error, falling back to demo mode for Ora #${oraNumber}`)
      const demoResponse = generateDemoResponse(traits)

      let errorMessage = "AI temporarily unavailable - using demo analysis"
      let retryAfter = 60

      if (openaiError instanceof Error) {
        const errorMsg = openaiError.message.toLowerCase()

        if (errorMsg.includes("429") || errorMsg.includes("rate limit")) {
          errorMessage = "Rate limited - using demo analysis"
          retryAfter = 60
        } else if (errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
          errorMessage = "API key invalid - using demo analysis"
        } else if (errorMsg.includes("quota") || errorMsg.includes("billing")) {
          errorMessage = "Quota exceeded - using demo analysis"
        }
      }

      return NextResponse.json({
        ...demoResponse,
        _demo: true,
        _message: errorMessage,
        retryAfter,
      })
    }
  } catch (unexpectedError) {
    console.error("Unexpected error in analyze route:", unexpectedError)

    const demoResponse = generateDemoResponse([])
    return NextResponse.json({
      ...demoResponse,
      _demo: true,
      _message: "Service temporarily unavailable - using demo analysis",
      error: "unexpected_error",
    })
  }
}
