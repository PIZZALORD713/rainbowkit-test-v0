"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check, Sparkles, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIM } from "@/types/aim"
import { AimJsonPanel } from "./AimJsonPanel"

interface AimPreviewProps {
  oraId: number
  aim: AIM
}

const getTypeGradient = (type: string) => {
  const gradients = {
    Void: "from-slate-900 to-indigo-900",
    Light: "from-amber-100 to-white",
    Blue: "from-sky-100 to-sky-200",
    Fire: "from-red-100 to-orange-200",
    Earth: "from-green-100 to-emerald-200",
    Water: "from-blue-100 to-cyan-200",
    Air: "from-purple-100 to-indigo-200",
  }
  return gradients[type as keyof typeof gradients] || "from-zinc-100 to-white"
}

export function AimPreview({ oraId, aim }: AimPreviewProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Dispatch telemetry event
    window.dispatchEvent(
      new CustomEvent("demo_metric", {
        detail: { event: "aim_view", oraId },
      }),
    )
  }, [oraId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(aim, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  // Generate mock traits based on AIM data
  const mockTraits = {
    Background: aim.visuals.palette?.[0] || "Cosmic",
    Type: aim.personality.alignment?.split(" ")[1] || "Light",
    Special: aim.abilities.strengths?.[0] || "Unique",
    Eyes: aim.behavior.mannerisms?.[0]?.includes("eyes") ? "Glowing" : "Bright",
  }

  const oraType = mockTraits.Type
  const displayName = `Demo Ora #${oraId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/demo">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Demo
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-slate-600 text-sm">Powered by MCP Server</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-4 py-2">
              MCP Profile Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Ora Card */}
          <div className="space-y-6">
            <Card className={cn("overflow-hidden bg-gradient-to-br shadow-xl", getTypeGradient(oraType))}>
              <CardContent className="p-6">
                {/* Ora Image */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm mb-6">
                  <div className="absolute inset-1 rounded-lg overflow-hidden">
                    <img
                      src={`/ceholder-svg-height-400-width-400-text-ora-.jpg?height=400&width=400&text=Ora+${oraId}`}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
                </div>

                {/* Traits */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.entries(mockTraits).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="bg-white/60 text-slate-700 font-medium">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link href={`/demo/${oraId}/template`} className="block">
                    <Button className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Use Template Prompts
                    </Button>
                  </Link>
                  <Link href={`/demo/${oraId}/custom`} className="block">
                    <Button
                      variant="outline"
                      className="w-full h-12 bg-white/90 hover:bg-white border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold transition-all duration-200"
                    >
                      <Wand2 className="w-5 h-5 mr-2" />
                      Write Your Own Prompt
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: JSON Panel */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-900">AIM Profile from MCP Server</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 bg-transparent">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-slate-600 text-sm">
                  This AIM profile was generated by the Model Context Protocol server and contains structured character
                  data for AI applications.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <AimJsonPanel aim={aim} />
              </CardContent>
            </Card>

            {/* Info Panel */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What is MCP?</h3>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  The Model Context Protocol (MCP) enables AI applications to access structured character data in a
                  standardized format. This ensures your Ora's personality and traits remain consistent across different
                  AI tools and platforms.
                </p>
                <Link href="/learn/mcp">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-transparent"
                  >
                    Learn More About MCP
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
