"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Sparkles, ImageIcon, Sticker, Monitor, RefreshCw } from "lucide-react"
import type { AIM } from "@/types/aim"
import { OutputGallery } from "./OutputGallery"
import { UpsellBanner } from "./UpsellBanner"

interface TemplateGenerationProps {
  oraId: number
  aim: AIM
}

type GenerationMode = "portrait" | "sticker" | "wallpaper"

interface GenerationState {
  loading: boolean
  images: string[]
  error: string | null
}

const tabConfig = {
  portrait: {
    icon: ImageIcon,
    label: "Portrait",
    description: "Character portraits and headshots",
  },
  sticker: {
    icon: Sticker,
    label: "Sticker",
    description: "Fun sticker designs and emotes",
  },
  wallpaper: {
    icon: Monitor,
    label: "Wallpaper",
    description: "Desktop and mobile wallpapers",
  },
}

export function TemplateGeneration({ oraId, aim }: TemplateGenerationProps) {
  const [activeTab, setActiveTab] = useState<GenerationMode>("portrait")
  const [generations, setGenerations] = useState<Record<GenerationMode, GenerationState>>({
    portrait: { loading: false, images: [], error: null },
    sticker: { loading: false, images: [], error: null },
    wallpaper: { loading: false, images: [], error: null },
  })

  const displayName = `Demo Ora #${oraId}`

  useEffect(() => {
    // Dispatch telemetry event
    window.dispatchEvent(
      new CustomEvent("demo_metric", {
        detail: { event: "render_start", oraId, mode: activeTab },
      }),
    )
  }, [oraId, activeTab])

  const generateImages = async (mode: GenerationMode) => {
    setGenerations((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], loading: true, error: null },
    }))

    try {
      const response = await fetch("/api/demo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          ora: oraId,
          aim,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.")
        }
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      setGenerations((prev) => ({
        ...prev,
        [mode]: { loading: false, images: data.images, error: null },
      }))

      // Dispatch success telemetry
      window.dispatchEvent(
        new CustomEvent("demo_metric", {
          detail: { event: "render_success", oraId, mode, imageCount: data.images.length },
        }),
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Generation failed"
      setGenerations((prev) => ({
        ...prev,
        [mode]: { loading: false, images: [], error: errorMessage },
      }))

      // Dispatch error telemetry
      window.dispatchEvent(
        new CustomEvent("demo_metric", {
          detail: { event: "render_fail", oraId, mode, error: errorMessage },
        }),
      )
    }
  }

  const handleTabChange = (value: string) => {
    const mode = value as GenerationMode
    setActiveTab(mode)

    // Auto-generate if no images exist for this tab
    if (generations[mode].images.length === 0 && !generations[mode].loading) {
      generateImages(mode)
    }
  }

  // Auto-generate portrait on first load
  useEffect(() => {
    if (generations.portrait.images.length === 0 && !generations.portrait.loading) {
      generateImages("portrait")
    }
  }, [])

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
                <p className="text-slate-600 text-sm">Template Prompt Generation</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2">
              AI Generation Demo
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Ora Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {displayName}
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  Generate AI artwork using template prompts powered by your Ora's AIM profile.
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
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
                    <span className="font-medium text-slate-700">Alignment:</span>
                    <span className="text-slate-600 ml-2">{aim.personality.alignment || "Neutral"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Strengths:</span>
                    <span className="text-slate-600 ml-2">{aim.abilities.strengths?.join(", ") || "Various"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Generation Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    {Object.entries(tabConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {Object.entries(tabConfig).map(([key, config]) => {
                    const mode = key as GenerationMode
                    const state = generations[mode]
                    return (
                      <TabsContent key={key} value={key} className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-slate-900 mb-2">{config.label} Generation</h3>
                          <p className="text-slate-600 mb-4">{config.description}</p>
                          <Button
                            onClick={() => generateImages(mode)}
                            disabled={state.loading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {state.loading ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                {state.images.length > 0 ? "Regenerate" : "Generate"}
                              </>
                            )}
                          </Button>
                        </div>

                        <OutputGallery images={state.images} loading={state.loading} error={state.error} mode={mode} />
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </CardContent>
            </Card>

            {/* Upsell Banner */}
            <div className="mt-8">
              <UpsellBanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
