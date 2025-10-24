import { type NextRequest, NextResponse } from "next/server"
import { imageGenerate } from "@/lib/openai"

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Missing required field: prompt" }, { status: 400 })
    }

    // Validate size parameter
    const validSizes = ["1024x1024", "1024x1792", "1792x1024"]
    if (!validSizes.includes(size)) {
      return NextResponse.json({ error: "Invalid size. Must be one of: " + validSizes.join(", ") }, { status: 400 })
    }

    const images = await imageGenerate(prompt, {
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      quality: "standard",
      n: 1,
    })

    // Optional: Proxy images through ORAKIT_IMAGE_PROXY_URL if configured
    const proxyUrl = process.env.ORAKIT_IMAGE_PROXY_URL
    const processedImages = images.map((img: any) => ({
      url: proxyUrl ? `${proxyUrl}?url=${encodeURIComponent(img.url)}` : img.url,
      revised_prompt: img.revised_prompt,
    }))

    return NextResponse.json({ images: processedImages })
  } catch (error) {
    console.error("DALL·E render error:", error)

    if (error instanceof Error && error.message.includes("OpenAI API key")) {
      return NextResponse.json({ error: "AI image generation unavailable - API key not configured" }, { status: 503 })
    }

    return NextResponse.json({ error: "Image generation failed" }, { status: 500 })
  }
}
