import { type NextRequest, NextResponse } from "next/server"
import { chat } from "@/lib/openai"
import type { PromptBundle } from "@/types/aim"

const PROMPT_COMPOSER_SYSTEM_PROMPT = `You convert AIM data into DALL·E prompts. Output JSON only: PromptBundle format.

Rules:
- Each prompt: subject + composition + style + lighting + color + camera angle
- Respect visuals.palette and motifs from AIM
- No UI text, logos, or words in images
- Style: solarpunk sci-fi aesthetic
- 4 categories: portrait, action, sticker, wallpaper
- Include negative prompts to avoid unwanted elements

Example output:
{
  "portrait": ["close-up portrait of [character], soft lighting, vibrant colors, digital art"],
  "action": ["[character] in dynamic pose, action scene, cinematic lighting"],
  "sticker": ["cute chibi [character], simple background, sticker style"],
  "wallpaper": ["[character] in expansive landscape, wide shot, desktop wallpaper"],
  "negative": ["text", "logos", "weapons", "violence", "low quality"]
}`

export async function POST(request: NextRequest) {
  try {
    const { aim, modes = ["portrait", "action", "sticker", "wallpaper"] } = await request.json()

    if (!aim) {
      return NextResponse.json({ error: "Missing required field: aim" }, { status: 400 })
    }

    const userPrompt = `Generate DALL·E prompts for Ora #${aim.meta?.oraNumber}:

AIM Data:
${JSON.stringify(aim, null, 2)}

Requested modes: ${modes.join(", ")}

Create engaging prompts that capture the character's essence.`

    const response = await chat(
      [
        { role: "system", content: PROMPT_COMPOSER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.8,
        max_tokens: 1000,
      },
    )

    // Parse JSON response
    let prompts: PromptBundle
    try {
      prompts = JSON.parse(response)
    } catch (parseError) {
      console.error("Failed to parse AI response:", response)
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error("Prompt generation error:", error)

    if (error instanceof Error && error.message.includes("OpenAI API key")) {
      return NextResponse.json({ error: "AI prompt generation unavailable - API key not configured" }, { status: 503 })
    }

    return NextResponse.json({ error: "Prompt generation failed" }, { status: 500 })
  }
}
