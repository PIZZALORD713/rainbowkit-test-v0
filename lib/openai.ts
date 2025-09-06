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

export async function chat(messages: ChatMessage[], options: ChatOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

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
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

export async function imageGenerate(prompt: string, options: ImageOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

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
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data || []
}
