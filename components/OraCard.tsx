"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Heart, ExternalLink, ChevronDown, ChevronUp, Sparkles, Eye, Zap, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OraTrait = {
  key: "background" | "type" | "special" | "eyes" | string
  label: string
  value: string
  icon?: React.ReactNode
}

export type OraCardProps = {
  id: string | number
  name: string
  number: number
  imageUrl: string
  type: string
  traits: OraTrait[]
  openSeaUrl: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onCreateAim?: () => void
  aimStatusText?: string
}

const getTypeGradient = (type: string) => {
  const gradients = {
    Void: "from-slate-900 to-indigo-900",
    Light: "from-amber-100 to-white",
    Blue: "from-sky-100 to-sky-200",
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
  return icons[key as keyof typeof icons]
}

const TraitChip = ({ trait }: { trait: OraTrait }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/50 text-xs font-medium text-slate-700">
    {getTraitIcon(trait.key)}
    <span className="text-slate-500">{trait.label}:</span>
    <span className="text-slate-800 font-semibold">{trait.value}</span>
  </div>
)

export default function OraCard({
  id,
  name,
  number,
  imageUrl,
  type,
  traits,
  openSeaUrl,
  isFavorite = false,
  onToggleFavorite,
  onCreateAim,
  aimStatusText,
}: OraCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Sort traits in the specified order: Background → Type → Special → Eyes → Others
  const sortedTraits = [...traits].sort((a, b) => {
    const order = ["background", "type", "special", "eyes"]
    const aIndex = order.indexOf(a.key.toLowerCase())
    const bIndex = order.indexOf(b.key.toLowerCase())

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  const visibleTraits = isExpanded ? sortedTraits : sortedTraits.slice(0, 4)
  const hasMoreTraits = sortedTraits.length > 4

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1",
        getTypeGradient(type),
      )}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-tight text-balance">{name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs font-medium bg-white/60 text-slate-600">
              #{number}
            </Badge>
          </div>

          {/* Favorite button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="p-2 h-9 w-9 bg-white/80 hover:bg-white rounded-full shadow-sm backdrop-blur-sm focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-slate-600 hover:text-red-500",
              )}
            />
          </Button>
        </div>
      </div>

      {/* Media */}
      <div className="relative mx-4 mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm">
        <div className="absolute inset-1 rounded-lg overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={`${name} #${number}`}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
        {/* Inner glow frame */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>

      {/* Traits */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {visibleTraits.map((trait, index) => (
            <TraitChip key={`${trait.key}-${index}`} trait={trait} />
          ))}

          {hasMoreTraits && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Show fewer traits" : "Show more traits"}
              className="inline-flex items-center gap-1 px-2.5 py-1 h-auto bg-white/60 hover:bg-white/80 rounded-full border border-slate-200/50 text-xs font-medium text-slate-600 hover:text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  +{sortedTraits.length - 4} more
                  <ChevronDown className="w-3 h-3" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onCreateAim}
            className="flex-1 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
          >
            Create AIM Profile
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(openSeaUrl, "_blank")}
            aria-label="View on OpenSea"
            className="h-9 w-9 p-0 bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Optional footer meta */}
        {aimStatusText && <p className="mt-3 text-xs text-slate-500 text-center">{aimStatusText}</p>}
      </div>
    </div>
  )
}
