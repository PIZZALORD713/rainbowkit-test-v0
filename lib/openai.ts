import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-demo-mode",
})

export default openai

// Keep backward compatibility with existing helper functions
export async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 800

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.status || error?.code

      // Only retry on rate limit errors and if we have retries left
      if (status === 429 && i < maxRetries - 1) {
        const waitTime = delay
        console.log(`[v0] Rate limited, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        delay *= 2 // Exponential backoff
        continue
      }

      throw error
    }
  }

  throw new Error("Retry attempts exhausted")
}

// Legacy chat function for backward compatibility
export async function chat(messages: any[], options: any = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  return withBackoff(async () => {
    const response = await openai.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      response_format: options.response_format || { type: "json_object" },
    })

    return response.choices[0]?.message?.content || ""
  })
}

// Legacy image generation function for backward compatibility
export async function imageGenerate(prompt: string, options: any = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  return withBackoff(async () => {
    const response = await openai.images.generate({
      model: options.model || "dall-e-3",
      prompt,
      size: options.size || "1024x1024",
      quality: options.quality || "standard",
      n: options.n || 1,
    })

    return response.data || []
  })
}
