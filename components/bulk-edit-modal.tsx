// Exports a subset of AIM files as JSON in v2 format.
// Converts NFT metadata to canonical traits and creates proper v2 structure.
"use client"

import { useState, useMemo } from "react"
import { X, CheckCircle, Download, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createEmptyAIMv2 } from "@/types/aim-v2"
import type { AIMv2 } from "@/types/aim"

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

function buildAIMv2File(ora: SelectedOra, collectionName: string): AIMv2 {
  const now = new Date().toISOString()
  const aimFile = createEmptyAIMv2(`aim-v2-${ora.oraNumber}-${Date.now()}`)

  // Set subject information
  aimFile.subject = {
    chain: "ethereum",
    contract: "unknown", // Would be populated with actual contract address
    tokenId: ora.oraNumber,
    collectionName: collectionName,
  }

  // Set sources information
  aimFile.sources = {
    metadataUri: "", // Would be populated with actual metadata URI
    fetchedAt: now,
    metadataHash: "", // Would be populated with actual hash
    image: ora.image,
    openseaUrl: `https://opensea.io/assets/ethereum/unknown/${ora.oraNumber}`, // Generic URL
  }

  // Set canonical traits from NFT metadata
  aimFile.canonical = {
    traits: normalizeTraits(ora.traits),
    raw: ora.traits, // Store original traits as raw data
  }

  // Set normalized traits (same as canonical for now)
  aimFile.normalized = {
    traits: normalizeTraits(ora.traits),
    conflicts: [],
  }

  // Set persona with basic information
  aimFile.persona = {
    title: ora.name,
    nickname: undefined,
    alignment: "True Neutral",
    tone: "",
    tags: [],
    lore: "",
    goals: {
      shortTerm: [],
      longTerm: [],
      dreams: [],
    },
    traitsAdd: {}, // No additional traits initially
  }

  // Set UI configuration with suggested crystallized keys
  aimFile.ui = {
    crystallizedKeys: suggestCrystallizedKeys(ora.traits),
    lockedKeys: Object.keys(normalizeTraits(ora.traits)), // All canonical traits are locked
    highlights: [],
  }

  // Set timestamps
  aimFile.createdAt = now
  aimFile.updatedAt = now

  return aimFile
}

function normalizeTraits(traits: Record<string, string>) {
  const normalized: Record<string, string> = {}
  Object.entries(traits).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "_")
    normalized[normalizedKey] = value
  })
  return normalized
}

function suggestCrystallizedKeys(traits: Record<string, string>): string[] {
  const normalized = normalizeTraits(traits)
  const importantKeys = ["head", "eyes", "background", "clothing", "accessory", "face_accessory", "aura"]

  return importantKeys.filter((key) => key in normalized)
}

export default function BulkEditModal({ selectedOras, collectionName, onClose }: BulkEditModalProps) {
  const [copied, setCopied] = useState(false)

  const aimFiles = useMemo(
    () => selectedOras.map((ora) => buildAIMv2File(ora, collectionName)),
    [selectedOras, collectionName],
  )

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
    link.download = `${collectionName.toLowerCase().replace(/\s+/g, "_")}_aim_v2_export.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Bulk AIM v2 Export
            <Badge variant="default">v2</Badge>
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
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Exported data uses the new AIM v2 structure with canonical NFT traits and editable persona data.
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <p className="font-medium mb-1">AIM v2 Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Canonical traits from NFT metadata (locked)</li>
                <li>Separate persona customization layer</li>
                <li>Crystallized trait highlighting</li>
                <li>Conflict detection for trait additions</li>
              </ul>
            </div>
          </div>

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
                <div className="flex-1">
                  <p className="text-sm font-medium">{ora.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">#{ora.oraNumber}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(ora.traits)
                      .slice(0, 3)
                      .map((trait) => (
                        <Badge key={trait} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    {Object.keys(ora.traits).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.keys(ora.traits).length - 3}
                      </Badge>
                    )}
                  </div>
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
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </>
            )}
          </Button>
          <Button variant="default" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Export AIM v2 Files
          </Button>
        </div>
      </div>
    </div>
  )
}
