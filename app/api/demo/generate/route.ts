import { type NextRequest, NextResponse } from "next/server"
import type { AIM } from "@/types/aim"

// In-memory rate limiting
const rateLimitMap = new Map<number, number>()
const RATE_LIMIT_WINDOW = 5000 // 5 seconds
const GENERATION_DELAY = 800 // 800ms artificial delay

interface GenerateRequest {
  mode: "portrait" | "sticker" | "wallpaper" | "custom"
  ora: number
  aim: AIM
  userPrompt?: string
}

// Mock image generation with placeholder URLs
const generateMockImages = (mode: string, oraId: number): string[] => {
  const baseUrl = "https://picsum.photos"
  const seed = oraId + mode.length // Simple seed based on ora and mode

  switch (mode) {
    case "portrait":
      return [
        `${baseUrl}/400/400?random=${seed}1`,
        `${baseUrl}/400/400?random=${seed}2`,
        `${baseUrl}/400/400?random=${seed}3`,
      ]
    case "sticker":
      return [`${baseUrl}/300/300?random=${seed}4`, `${baseUrl}/300/300?random=${seed}5`]
    case "wallpaper":
      return [`${baseUrl}/1920/1080?random=${seed}6`, `${baseUrl}/1920/1080?random=${seed}7`]
    case "custom":
      return [`${baseUrl}/500/500?random=${seed}8`]
    default:
      return [`${baseUrl}/400/400?random=${seed}9`]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { mode, ora, aim, userPrompt } = body

    // Validate request
    if (!mode || !ora || !aim) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Rate limiting check
    const now = Date.now()
    const lastRequest = rateLimitMap.get(ora)
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000)
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${remainingTime} seconds before trying again.` },
        { status: 429 },
      )
    }

    // Update rate limit
    rateLimitMap.set(ora, now)

    // Artificial delay to simulate real generation
    await new Promise((resolve) => setTimeout(resolve, GENERATION_DELAY + Math.random() * 400))

    // Generate mock images
    const images = generateMockImages(mode, ora)

    console.log(`[Demo API] Generated ${images.length} ${mode} images for Ora #${ora}`)

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Demo generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
