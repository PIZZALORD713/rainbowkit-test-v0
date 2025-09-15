import { type NextRequest, NextResponse } from "next/server"
import openai from "@/lib/openai"

const PROMPT_BUNDLE_SCHEMA = {
  type: "object",
  properties: {
    portrait: {
      type: "array",
      items: { type: "string" },
      description: "Portrait prompts for close-up character images",
    },
    action: {
      type: "array",
      items: { type: "string" },
      description: "Action scene prompts showing character in dynamic poses",
    },
    sticker: {
      type: "array",
      items: { type: "string" },
      description: "Cute sticker-style prompts for simple character representations",
    },
    wallpaper: {
      type: "array",
      items: { type: "string" },
      description: "Wallpaper prompts for wide landscape scenes with character",
    },
    negative: {
      type: "array",
      items: { type: "string" },
      description: "Negative prompts to avoid unwanted elements",
    },
  },
  required: ["portrait", "action", "sticker", "wallpaper", "negative"],
  additionalProperties: false,
}

const PROMPT_COMPOSER_SYSTEM_PROMPT = `You convert AIM data into DALL·E prompts. Output JSON only: PromptBundle format.

Rules:
- Each prompt: subject + composition + style + lighting + color + camera angle
- Respect visuals.palette and motifs from AIM
- No UI text, logos, or words in images
- Style: solarpunk sci-fi aesthetic
- 4 categories: portrait, action, sticker, wallpaper
- Include negative prompts to avoid unwanted elements
- Use character's personality and visual traits to inform prompts
- Keep prompts concise but descriptive`

export async function POST(request: NextRequest) {
  try {
    const { aim, modes = ["portrait", "action", "sticker", "wallpaper"], previous_response_id } = await request.json()

    if (!aim) {
      return NextResponse.json({ error: "Missing required field: aim" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI prompt generation unavailable - API key not configured" }, { status: 503 })
    }

    const userPrompt = `Generate DALL·E prompts for Ora #${aim.meta?.oraNumber}:

AIM Data:
${JSON.stringify(aim, null, 2)}

Requested modes: ${modes.join(", ")}

Create engaging prompts that capture the character's essence, personality, and visual style.`

    console.log(`[v0] Generating prompts for Ora #${aim.meta?.oraNumber}`)

    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PROMPT_COMPOSER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prompt_bundle",
          schema: PROMPT_BUNDLE_SCHEMA,
          strict: true,
        },
      },
      temperature: 0.8,
      max_tokens: 1500,
      ...(previous_response_id && { previous_response_id }),
    })

    const prompts = response.choices[0]?.message?.parsed
    if (!prompts) {
      throw new Error("No parsed content in OpenAI response")
    }

    console.log(`[v0] Successfully generated prompts for Ora #${aim.meta?.oraNumber}`)

    return NextResponse.json({
      prompts,
      response_id: response.id, // Return response ID for potential follow-up requests
    })
  } catch (error) {
    console.error("Prompt generation error:", error)

    if (error instanceof Error && error.message.includes("OpenAI API key")) {
      return NextResponse.json({ error: "AI prompt generation unavailable - API key not configured" }, { status: 503 })
    }

    return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 })
  }
}
