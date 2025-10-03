export const runtime = "nodejs"

import type { NextRequest } from "next/server"

console.log("[v0] ======== ANALYZE ROUTE MODULE LOADING ========")

// Helper to create JSON responses
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })

// Demo responses based on Ora type
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

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const demoResponse = generateDemoResponse(traits)

    console.log(`[v0] Returning demo response for Ora #${oraNumber}`)

    return json({
      ...demoResponse,
      _demo: true,
      _message: "Demo mode - AI analysis simulated",
    })
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
