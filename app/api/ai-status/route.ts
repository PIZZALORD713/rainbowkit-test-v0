import { NextResponse } from "next/server"

export async function GET() {
  const isAvailable = !!process.env.OPENAI_API_KEY

  return NextResponse.json({
    aiAvailable: isAvailable,
    features: {
      analysis: isAvailable,
      promptGeneration: isAvailable,
      imageGeneration: isAvailable,
    },
  })
}
