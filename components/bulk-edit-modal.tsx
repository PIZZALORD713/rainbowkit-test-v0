// Exports a subset of AIM files as JSON.
// Keep schema stable and documented so files remain portable across tools.
"use client"

import { useState, useMemo } from "react"
import { X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AIMFile } from "@/types/aim"

interface SelectedOra {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
}

interface BulkEditModalProps {
  selectedOras: SelectedOra[]
  collectionName: string
  onClose: () => void
}

function normalizeTraits(traits: Record<string, string>) {
  const normalized: Record<string, string> = {}
  Object.entries(traits).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "_")
    normalized[normalizedKey] = value
  })
  return normalized
}

function buildAIMFile(ora: SelectedOra): AIMFile {
  const now = new Date().toISOString()
  const normalizedTraits = normalizeTraits(ora.traits)

  return {
    id: `aim-${ora.oraNumber}-${Date.now()}`,
    oraNumber: ora.oraNumber,
    oraName: ora.name,
    oraImage: ora.image,
    characterName: ora.name,
    createdAt: now,
    updatedAt: now,
    version: "1",
    personality: {
      primaryTraits: [normalizedTraits.head, normalizedTraits.eyes].filter(Boolean),
      secondaryTraits: [],
      alignment: "True Neutral",
      temperament: "",
      motivations: [],
      fears: [],
      quirks: [],
    },
    backstory: {
      origin: "",
      childhood: "",
      formativeEvents: [],
      relationships: [],
      achievements: [],
      failures: [],
    },
    abilities: {
      strengths: [],
      weaknesses: [],
      specialPowers: [],
      skills: [],
    },
    behavior: {
      speechPatterns: "",
      mannerisms: [],
      habits: [],
      socialStyle: "Ambivert",
      conflictResolution: "",
      decisionMaking: "",
    },
    appearance: {
      clothing: normalizedTraits.clothing || "",
      distinctiveFeatures: [],
      accessories: [normalizedTraits.face_accessory].filter(Boolean),
    },
    goals: {
      shortTerm: [],
      longTerm: [],
      dreams: [],
    },
    tags: [],
    notes: "",
  }
}

export default function BulkEditModal({ selectedOras, collectionName, onClose }: BulkEditModalProps) {
  const [copied, setCopied] = useState(false)

  const aimFiles = useMemo(() => selectedOras.map(buildAIMFile), [selectedOras])
  const jsonString = JSON.stringify(aimFiles, null, 2)

  const handleCopy = async () => {
    // Copy to clipboard for quick share. Fallback to download when not permitted.
      await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bulk_aim_export.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Bulk AIM Export
            <Badge variant="secondary">{selectedOras.length}</Badge>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Exported data now matches the AIM file structure and can be imported back into the AIM Editor.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedOras.map((ora) => (
              <div
                key={ora.oraNumber}
                className="flex items-center gap-3 p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
              >
                <img
                  src={ora.image || "/placeholder_light_gray_block.png"}
                  alt={ora.name}
                  className="w-14 h-14 object-cover rounded-md"
                />
                <div>
                  <p className="text-sm font-medium">{ora.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">#{ora.oraNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" /> Copied!
              </span>
            ) : (
              "Copy JSON"
            )}
          </Button>
          <Button variant="default" onClick={handleDownload}>
            Export AIM Files
          </Button>
        </div>
      </div>
    </div>
  )
}
