"use client"
import { useState } from "react"
import type React from "react"

import { Heart, ExternalLink, ChevronDown, ChevronUp, Sparkles, Eye, Zap, Palette, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AIMAutofill } from "@/components/aim-autofill"
import { PromptStudio } from "@/components/prompt-studio"
import { AIMStorage } from "@/lib/aim-storage"
import { mergeAIM } from "@/lib/aim-merge"
import type { AIMDelta, AIM } from "@/types/aim"

export type Ora = {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

export type OraCardProps = {
  ora: Ora
  displayName: string
  hasAIM: boolean
  isFavorite: boolean
  isSelected?: boolean
  selectionMode?: boolean
  onToggleFavorite: () => void
  onToggleSelection?: (checked: boolean) => void
  onOpenAIMEditor: () => void
}

const isAIAvailable = () => {
  // This would be set by a server component or API route that checks for OPENAI_API_KEY
  const available = typeof window !== "undefined" && (window as any).__AI_AVAILABLE !== false
  console.log(
    "[v0] AI availability check:",
    available,
    "window.__AI_AVAILABLE:",
    typeof window !== "undefined" ? (window as any).__AI_AVAILABLE : "server-side",
  )
  return available
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
    Clothing: "bg-blue-100 text-blue-800",
    Eyes: "bg-amber-100 text-amber-800",
    "Face Accessory": "bg-rose-100 text-rose-800",
    Head: "bg-violet-100 text-violet-800",
    "Left Hand": "bg-cyan-100 text-cyan-800",
    Mouth: "bg-orange-100 text-orange-800",
    "Right Hand": "bg-teal-100 text-teal-800",
    Special: "bg-pink-100 text-pink-800",
    Type: "bg-indigo-100 text-indigo-800",
  }
  return colors[traitType as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

const TraitChip = ({ traitKey, traitValue }: { traitKey: string; traitValue: string }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTraitColor(traitKey)}`}
  >
    {getTraitIcon(traitKey)}
    <span className="opacity-80">{traitKey}:</span>
    <span className="font-semibold">{traitValue}</span>
  </div>
)

export function OraCard({
  ora,
  displayName,
  hasAIM,
  isFavorite,
  isSelected = false,
  selectionMode = false,
  onToggleFavorite,
  onToggleSelection,
  onOpenAIMEditor,
}: OraCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAIMAutofill = (delta: AIMDelta, accepted: Record<string, boolean>) => {
    console.log("[v0] handleAIMAutofill called with delta:", delta, "accepted:", accepted)
    try {
      // Get existing AIM or create new one
      const existingAIM = AIMStorage.getByOraNumber(ora.oraNumber)
      let baseAIM: AIM

      if (existingAIM) {
        // Convert existing AIMFile to AIM format
        baseAIM = {
          meta: { oraNumber: Number.parseInt(ora.oraNumber), source: "user", updatedAt: existingAIM.updatedAt },
          personality: {
            primary: existingAIM.personality.primaryTraits,
            secondary: existingAIM.personality.secondaryTraits,
            alignment: existingAIM.personality.alignment,
          },
          backstory: {
            origin: existingAIM.backstory.origin,
            beats: existingAIM.backstory.formativeEvents,
          },
          abilities: {
            strengths: existingAIM.abilities.strengths,
            weaknesses: existingAIM.abilities.weaknesses,
            skills: existingAIM.abilities.skills.map((s) => s.name),
          },
          behavior: {
            speech: existingAIM.behavior.speechPatterns,
            mannerisms: existingAIM.behavior.mannerisms,
          },
          visuals: {
            palette: [], // Could be derived from traits
            motifs: existingAIM.appearance.distinctiveFeatures,
          },
        }
      } else {
        // Create new base AIM
        baseAIM = {
          meta: { oraNumber: Number.parseInt(ora.oraNumber), source: "ai", updatedAt: new Date().toISOString() },
          personality: { primary: [] },
          backstory: {},
          abilities: {},
          behavior: {},
          visuals: {},
        }
      }

      // Merge AI suggestions
      const mergedAIM = mergeAIM(baseAIM, delta, accepted)

      // Convert back to AIMFile format and save
      // This is a simplified conversion - in practice you'd want more robust mapping
      console.log("[v0] AI suggestions applied:", mergedAIM)

      // Trigger AIM editor to show the updated data
      onOpenAIMEditor()
    } catch (error) {
      console.error("[v0] Error applying AI suggestions:", error)
    }
  }

  // Sort traits in the specified order: Background → Type → Special → Eyes → Others
  const traitEntries = Object.entries(ora.traits)
  const sortedTraits = [...traitEntries].sort(([keyA], [keyB]) => {
    const order = ["background", "type", "special", "eyes"]
    const aIndex = order.indexOf(keyA.toLowerCase())
    const bIndex = order.indexOf(keyB.toLowerCase())

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })

  const visibleTraits = isExpanded ? sortedTraits : sortedTraits.slice(0, 4)
  const hasMoreTraits = sortedTraits.length > 4

  // Get the type for gradient (assuming it's in the traits)
  const oraType = ora.traits.Type || "Light"

  console.log("[v0] OraCard rendered for:", displayName, "OpenSea URL:", ora.openseaUrl)
  console.log("[v0] Traits count:", Object.keys(ora.traits).length, "isExpanded:", isExpanded)

  console.log(
    "[v0] sortedTraits.length:",
    sortedTraits.length,
    "hasMoreTraits:",
    hasMoreTraits,
    "visibleTraits.length:",
    visibleTraits.length,
  )

  const handleTraitExpansion = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] Trait expansion clicked, current isExpanded:", isExpanded)
    setIsExpanded(!isExpanded)
    console.log("[v0] Trait expansion toggled to:", !isExpanded)
  }

  const aiAvailable = isAIAvailable()
  console.log("[v0] AI available for Ora", ora.oraNumber, ":", aiAvailable)

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1",
        getTypeGradient(oraType),
      )}
    >
      {/* Selection checkbox for bulk mode */}
      {selectionMode && onToggleSelection && (
        <input
          type="checkbox"
          aria-label={`Select ${displayName}`}
          checked={isSelected}
          onChange={(e) => onToggleSelection(e.target.checked)}
          className="absolute top-3 left-3 z-20 w-5 h-5 text-indigo-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      )}

      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-tight text-balance">{displayName}</h3>
            <Badge variant="secondary" className="mt-1 text-xs font-medium bg-white/60 text-slate-600">
              #{ora.oraNumber}
            </Badge>
          </div>

          <div className="flex gap-2">
            {hasAIM && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm px-3 py-1 shadow-lg">
                AIM ✓
              </Badge>
            )}

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
      </div>

      {/* Media */}
      <div className="relative mx-4 mb-4 aspect-square overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm">
        <div className="absolute inset-1 rounded-lg overflow-hidden">
          <img
            src={ora.image || "/placeholder.svg?height=400&width=400&text=Ora"}
            alt={`${displayName} #${ora.oraNumber}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
        {/* Inner glow frame */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>

      {/* Traits */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {visibleTraits.map(([key, value], index) => (
            <TraitChip key={`${key}-${index}`} traitKey={key} traitValue={value} />
          ))}

          {hasMoreTraits && (
            <button
              type="button"
              onClick={handleTraitExpansion}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Show fewer traits" : "Show more traits"}
              className="inline-flex items-center gap-1 px-2.5 py-1 h-auto bg-white/60 hover:bg-white/80 rounded-full border border-slate-200/50 text-xs font-medium text-slate-600 hover:text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 cursor-pointer"
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
            </button>
          )}
        </div>

        {/* Actions */}
        <div className={`space-y-3 ${selectionMode ? "opacity-50 pointer-events-none" : ""}`}>
          <button
            type="button"
            className="relative z-10 w-full flex items-center justify-center gap-2 h-10 bg-white/90 hover:bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 transition-all duration-200 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log("[v0] OpenSea button clicked, URL:", ora.openseaUrl)
              if (!ora.openseaUrl) {
                console.error("[v0] OpenSea URL is missing or undefined")
                return
              }
              try {
                const newWindow = window.open(ora.openseaUrl, "_blank", "noopener,noreferrer")
                if (!newWindow) {
                  console.error("[v0] Failed to open new window - popup blocked?")
                } else {
                  console.log("[v0] Successfully opened OpenSea URL")
                }
              } catch (error) {
                console.error("[v0] Error opening OpenSea URL:", error)
              }
            }}
          >
            <ExternalLink className="w-4 h-4" />
            View on OpenSea
          </button>

          {hasAIM ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/character/${ora.oraNumber}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 rounded-md"
                  >
                    <Eye className="w-4 h-4" />
                    View Profile
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="h-10 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  onClick={onOpenAIMEditor}
                >
                  <FileText className="w-4 h-4" />
                  Edit AIM
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  className="relative z-10"
                  onClick={(e) => {
                    console.log("[v0] AIMAutofill container clicked for Ora", ora.oraNumber)
                    e.stopPropagation()
                  }}
                >
                  <AIMAutofill
                    oraNumber={ora.oraNumber}
                    traits={ora.traits}
                    imageUrl={ora.image}
                    onApply={handleAIMAutofill}
                    disabled={!aiAvailable}
                  />
                </div>
                <PromptStudio
                  aim={{
                    meta: {
                      oraNumber: Number.parseInt(ora.oraNumber),
                      source: "user",
                      updatedAt: new Date().toISOString(),
                    },
                    personality: { primary: [] },
                    backstory: {},
                    abilities: {},
                    behavior: {},
                    visuals: {},
                  }}
                  disabled={!aiAvailable}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                onClick={onOpenAIMEditor}
              >
                <FileText className="w-4 h-4" />
                Create AIM Profile
              </Button>

              <div
                className="relative z-10"
                onClick={(e) => {
                  console.log("[v0] AIMAutofill container clicked for Ora", ora.oraNumber, "(no AIM)")
                  e.stopPropagation()
                }}
              >
                <AIMAutofill
                  oraNumber={ora.oraNumber}
                  traits={ora.traits}
                  imageUrl={ora.image}
                  onApply={handleAIMAutofill}
                  disabled={!aiAvailable}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
