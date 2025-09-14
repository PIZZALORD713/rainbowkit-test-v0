"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Wand2, RefreshCw, Sparkles, AlertCircle } from "lucide-react"
import type { AIM } from "@/types/aim"

interface CustomPromptProps {
  oraId: number
  aim: AIM
}

interface GenerationState {
  loading: boolean
  image: string | null
  error: string | null
}

export function CustomPrompt({ oraId, aim }: CustomPromptProps) {
  const [prompt, setPrompt] = useState("")
  const [generation, setGeneration] = useState<GenerationState>({
    loading: false,
    image: null,
    error: null,
  })

  const displayName = `Demo Ora #${oraId}`

  useEffect(() => {
    // Dispatch telemetry event
    window.dispatchEvent(
      new CustomEvent("demo_metric", {
        detail: { event: "custom_prompt_view", oraId },
      }),
    )
  }, [oraId])

  const generateImage = async () => {
    if (!prompt.trim()) {
      setGeneration((prev) => ({ ...prev, error: "Please enter a prompt description" }))
      return
    }

    setGeneration({ loading: true, image: null, error: null })

    try {
      const response = await fetch("/api/demo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "custom",
          ora: oraId,
          aim,
          userPrompt: prompt,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.")
        }
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      setGeneration({
        loading: false,
        image: data.images[0] || null,
        error: null,
      })

      // Dispatch success telemetry
      window.dispatchEvent(
        new CustomEvent("demo_metric", {
          detail: { event: "custom_render_success", oraId, promptLength: prompt.length },
        }),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Generation failed"
      setGeneration({
        loading: false,
        image: null,
        error: errorMessage,
      })

      // Dispatch error telemetry
      window.dispatchEvent(
        new CustomEvent("demo_metric", {
          detail: { event: "custom_render_fail", oraId, error: errorMessage },
        }),
      )
    }
  }

  const handlePromptChange = (value: string) => {
    setPrompt(value)
    // Clear any previous errors when user starts typing
    if (generation.error) {
      setGeneration((prev) => ({ ...prev, error: null }))
    }
  }

  const examplePrompts = [
    `${displayName} as a cyberpunk warrior in neon-lit city`,
    `${displayName} in a magical forest with glowing mushrooms`,
    `${displayName} as a space explorer on an alien planet`,
    `${displayName} in an art nouveau style poster`,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/demo/${oraId}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Profile
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-slate-600 text-sm">Custom Prompt Generation</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold px-4 py-2">
              Creative Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Ora Info & Prompt Input */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-green-600" />
                  {displayName}
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  Describe your creative vision and we'll generate a unique image using your Ora's AIM profile.
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-green-100 to-teal-100 mb-4">
                  <img
                    src={`/ceholder-svg-height-400-width-400-text-ora-.jpg?height=400&width=400&text=Ora+${oraId}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Personality:</span>
                    <span className="text-slate-600 ml-2">{aim.personality.primary?.join(", ") || "Unique"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Strengths:</span>
                    <span className="text-slate-600 ml-2">{aim.abilities.strengths?.join(", ") || "Various"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Input */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Describe Your Idea</CardTitle>
                <p className="text-slate-600 text-sm">
                  Be creative! Describe the scene, style, mood, or concept you want to see.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your idea..."
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{prompt.length}/500 characters</span>
                  {prompt.length > 0 && <span>✓ Ready to generate</span>}
                </div>

                <Button
                  onClick={generateImage}
                  disabled={generation.loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {generation.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>

                {generation.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {generation.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Need Inspiration?</CardTitle>
                <p className="text-green-700 text-sm">Try one of these example prompts:</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left p-3 bg-white/60 hover:bg-white/80 border border-green-200 rounded-lg text-sm text-green-800 hover:text-green-900 transition-colors duration-200"
                  >
                    "{example}"
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Generated Image */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Generated Image
                </CardTitle>
                <p className="text-slate-600 text-sm">Your custom prompt combined with {displayName}'s AIM profile</p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden relative">
                  {generation.loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-teal-100 animate-pulse">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-green-600 mx-auto mb-2 animate-spin" />
                        <p className="text-green-700 font-medium">Creating your vision...</p>
                        <p className="text-green-600 text-sm">This may take a moment</p>
                      </div>
                    </div>
                  )}

                  {generation.image && !generation.loading && (
                    <>
                      <img
                        src={generation.image || "/placeholder.svg"}
                        alt="Generated custom image"
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-4 right-4 bg-white/90 text-green-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Custom Generated
                      </Badge>
                    </>
                  )}

                  {!generation.image && !generation.loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Your generated image will appear here</p>
                        <p className="text-sm">Enter a prompt and click generate to start</p>
                      </div>
                    </div>
                  )}
                </div>

                {generation.image && !generation.loading && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Prompt:</span> "{prompt}"
                      </p>
                      <Button
                        onClick={generateImage}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA Banner */}
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0 text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-2">Love what you created?</h3>
                  <p className="text-white/90 text-sm mb-4">
                    Sign in to save your prompts, generate high-resolution images, and create unlimited artwork with
                    your entire Ora collection.
                  </p>
                  <Button
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("demo_metric", {
                          detail: { event: "upsell_click", source: "custom_prompt" },
                        }),
                      )
                    }
                    className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-6 py-2"
                  >
                    Sign In to Save & Export
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
