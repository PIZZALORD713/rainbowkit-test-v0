"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Eye, Zap, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIM } from "@/types/aim"
import { MockMCPService } from "@/lib/demo/mcp"

interface OraCardProps {
  oraId: number
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

const getTraitIcon = (key: string) => {
  const icons = {
    background: <Palette className="w-3 h-3" />,
    type: <Sparkles className="w-3 h-3" />,
    special: <Zap className="w-3 h-3" />,
    eyes: <Eye className="w-3 h-3" />,
  }
  return icons[key.toLowerCase() as keyof typeof icons]
}

const getTraitColor = (traitType: string) => {
  const colors = {
    Background: "bg-emerald-100 text-emerald-800",
    Type: "bg-indigo-100 text-indigo-800",
    Special: "bg-pink-100 text-pink-800",
    Eyes: "bg-amber-100 text-amber-800",
  }
  return colors[traitType as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

export function OraCard({ oraId }: OraCardProps) {
  const [aim, setAim] = useState<AIM | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAim = async () => {
      try {
        setLoading(true)
        const aimData = await MockMCPService.getAIM(oraId)
        setAim(aimData)

        // Dispatch telemetry event
        window.dispatchEvent(
          new CustomEvent("demo_metric", {
            detail: { event: "demo_ora_select", oraId },
          }),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AIM")
      } finally {
        setLoading(false)
      }
    }

    loadAim()
  }, [oraId])

  if (loading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200" />
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16 mb-4" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !aim) {
    return (
      <Card className="overflow-hidden border-red-200">
        <CardContent className="p-4 text-center">
          <div className="text-red-600 text-sm">{error || "AIM not found"}</div>
        </CardContent>
      </Card>
    )
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
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer",
        getTypeGradient(oraType),
      )}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-tight text-balance">{displayName}</h3>
            <Badge variant="secondary" className="mt-1 text-xs font-medium bg-white/60 text-slate-600">
              #{oraId}
            </Badge>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm px-3 py-1 shadow-lg">
            MCP ✓
          </Badge>
        </div>
      </div>

      {/* Media */}
      <div className="relative mx-4 mb-4 aspect-square overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm">
        <div className="absolute inset-1 rounded-lg overflow-hidden">
          <img
            src={`/ceholder-svg-height-400-width-400-text-ora-.jpg?height=400&width=400&text=Ora+${oraId}`}
            alt={`${displayName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
        {/* Inner glow frame */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>

      {/* Traits */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(mockTraits).map(([key, value]) => (
            <div
              key={key}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTraitColor(key)}`}
            >
              {getTraitIcon(key)}
              <span className="opacity-80">{key}:</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <Link href={`/demo/${oraId}`}>
          <Button className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <Eye className="w-4 h-4" />
            Explore AIM Profile
          </Button>
        </Link>
      </div>
    </div>
  )
}
