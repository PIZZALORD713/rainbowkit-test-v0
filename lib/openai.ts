interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface ChatOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

interface ImageOptions {
  model?: string
  size?: "1024x1024" | "1024x1792" | "1792x1024"
  quality?: "standard" | "hd"
  n?: number
}

export async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 800

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.status || error?.code
      const retryAfter = Number(error?.headers?.get?.("retry-after")) || 0

      // Only retry on rate limit errors and if we have retries left
      if (status === 429 && i < maxRetries - 1) {
        const waitTime = retryAfter ? retryAfter * 1000 : delay
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

export async function chat(messages: ChatMessage[], options: ChatOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  return withBackoff(async () => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`OpenAI API error: ${response.status}`)
      ;(error as any).status = response.status
      ;(error as any).headers = response.headers
      ;(error as any).data = errorData
      throw error
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ""
  })
}

export async function imageGenerate(prompt: string, options: ImageOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  return withBackoff(async () => {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model || "dall-e-3",
        prompt,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        n: options.n || 1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(`OpenAI API error: ${response.status}`)
      ;(error as any).status = response.status
      ;(error as any).headers = response.headers
      ;(error as any).data = errorData
      throw error
    }

    const data = await response.json()
    return data.data || []
  })
}
