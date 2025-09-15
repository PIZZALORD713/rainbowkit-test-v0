import { type NextRequest, NextResponse } from "next/server"
import openai from "@/lib/openai"

// JSON Schema for vision extraction
const VISION_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    detected_traits: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Traits detected from the image",
    },
    confidence_scores: {
      type: "object",
      additionalProperties: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
      },
      description: "Confidence scores for each detected trait",
    },
    discrepancies: {
      type: "array",
      items: { type: "string" },
      description: "Any discrepancies between metadata and visual appearance",
    },
    visual_description: {
      type: "string",
      description: "Overall description of the character's visual appearance",
    },
  },
  required: ["detected_traits", "confidence_scores", "visual_description"],
  additionalProperties: false,
}

const VISION_SYSTEM_PROMPT = `You are a visual NFT trait analyzer. Compare the provided metadata traits with what you actually see in the image.

Rules:
- Analyze the image carefully and identify visual traits
- Compare with provided metadata traits
- Note any discrepancies between metadata and visual appearance
- Provide confidence scores (0.0-1.0) for each detected trait
- Focus on: background, type/species, special features, eyes, clothing, accessories
- Be objective and accurate in your analysis`

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, metadata_traits = {} } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing required field: imageUrl" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Vision analysis unavailable - API key not configured" }, { status: 503 })
    }

    const userPrompt = `Analyze this NFT image and extract visual traits:

Provided Metadata Traits:
${JSON.stringify(metadata_traits, null, 2)}

Please identify what you actually see in the image and compare it with the provided metadata.`

    console.log(`[v0] Performing vision analysis on image: ${imageUrl.substring(0, 50)}...`)

    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vision_extraction",
          schema: VISION_EXTRACTION_SCHEMA,
          strict: true,
        },
      },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const analysis = response.choices[0]?.message?.parsed
    if (!analysis) {
      throw new Error("No parsed content in OpenAI response")
    }

    console.log(`[v0] Vision analysis completed successfully`)

    return NextResponse.json({
      ...analysis,
      _message: "Vision analysis complete",
    })
  } catch (error) {
    console.error("Vision extraction error:", error)

    if (error instanceof Error && error.message.includes("OpenAI API key")) {
      return NextResponse.json({ error: "Vision analysis unavailable - API key not configured" }, { status: 503 })
    }

    return NextResponse.json({ error: "Vision analysis failed" }, { status: 500 })
  }
}
