// Local profile manager for saved AIM files (v1 and v2).
// Filter/sort/metrics are memoized to keep the list responsive.
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AIMFile, AIMFileOrV2 } from "@/types/aim"
import { isAIMv2 } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { AIMMigration } from "@/lib/aim-migration"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Download,
  Upload,
  Trash2,
  Eye,
  FileText,
  ArrowLeft,
  Calendar,
  User,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

export default function ManagePage() {
  const router = useRouter()
  const [aimFiles, setAimFiles] = useState<AIMFileOrV2[]>([])
  const [filteredFiles, setFilteredFiles] = useState<AIMFileOrV2[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"name" | "created" | "updated" | "completion" | "version">("updated")
  const [filterBy, setFilterBy] = useState<"all" | "complete" | "incomplete" | "v1" | "v2">("all")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")

  useEffect(() => {
    loadAIMFiles()
  }, [])

  useEffect(() => {
    filterAndSortFiles()
  }, [aimFiles, searchQuery, sortBy, filterBy])

  const loadAIMFiles = () => {
    const v1Files = AIMStorage.getAll()
    const v2Files = AIMStorage.getAllV2()
    const allFiles: AIMFileOrV2[] = [...v1Files, ...v2Files]
    setAimFiles(allFiles)
  }

  const getCompletionPercentage = (aimFile: AIMFileOrV2) => {
    if (isAIMv2(aimFile)) {
      let totalFields = 0
      let filledFields = 0

      // Persona fields
      totalFields += 6
      if (aimFile.persona.title) filledFields++
      if (aimFile.persona.nickname) filledFields++
      if (aimFile.persona.alignment) filledFields++
      if (aimFile.persona.tone) filledFields++
      if (aimFile.persona.tags.length > 0) filledFields++
      if (aimFile.persona.lore) filledFields++

      // Goals
      totalFields += 3
      if (aimFile.persona.goals.shortTerm.length > 0) filledFields++
      if (aimFile.persona.goals.longTerm.length > 0) filledFields++
      if (aimFile.persona.goals.dreams.length > 0) filledFields++

      // Additional traits
      totalFields += 1
      if (Object.keys(aimFile.persona.traitsAdd).length > 0) filledFields++

      return Math.round((filledFields / totalFields) * 100)
    } else {
      // Original v1 calculation
      let totalFields = 0
      let filledFields = 0

      // Core identity
      totalFields += 4
      if (aimFile.characterName) filledFields++
      if (aimFile.nickname) filledFields++
      if (aimFile.age) filledFields++
      if (aimFile.species) filledFields++

      // Personality
      totalFields += 6
      if (aimFile.personality.primaryTraits.length > 0) filledFields++
      if (aimFile.personality.secondaryTraits.length > 0) filledFields++
      if (aimFile.personality.temperament) filledFields++
      if (aimFile.personality.motivations.length > 0) filledFields++
      if (aimFile.personality.fears.length > 0) filledFields++
      if (aimFile.personality.quirks.length > 0) filledFields++

      // Backstory
      totalFields += 4
      if (aimFile.backstory.origin) filledFields++
      if (aimFile.backstory.childhood) filledFields++
      if (aimFile.backstory.formativeEvents.length > 0) filledFields++
      if (aimFile.backstory.achievements.length > 0) filledFields++

      // Abilities
      totalFields += 3
      if (aimFile.abilities.strengths.length > 0) filledFields++
      if (aimFile.abilities.weaknesses.length > 0) filledFields++
      if (aimFile.abilities.specialPowers.length > 0) filledFields++

      // Behavior
      totalFields += 3
      if (aimFile.behavior.speechPatterns) filledFields++
      if (aimFile.behavior.mannerisms.length > 0) filledFields++
      if (aimFile.behavior.habits.length > 0) filledFields++

      // Goals
      totalFields += 3
      if (aimFile.goals.shortTerm.length > 0) filledFields++
      if (aimFile.goals.longTerm.length > 0) filledFields++
      if (aimFile.goals.dreams.length > 0) filledFields++

      return Math.round((filledFields / totalFields) * 100)
    }
  }

  const filterAndSortFiles = () => {
    let filtered = [...aimFiles]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((file) => {
        if (isAIMv2(file)) {
          return (
            file.persona.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.subject.tokenId.includes(searchQuery) ||
            file.persona.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        } else {
          return (
            file.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.oraNumber.includes(searchQuery) ||
            file.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        }
      })
    }

    // Apply completion filter
    if (filterBy === "complete") {
      filtered = filtered.filter((file) => getCompletionPercentage(file) >= 80)
    } else if (filterBy === "incomplete") {
      filtered = filtered.filter((file) => getCompletionPercentage(file) < 80)
    } else if (filterBy === "v1") {
      filtered = filtered.filter((file) => !isAIMv2(file))
    } else if (filterBy === "v2") {
      filtered = filtered.filter((file) => isAIMv2(file))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const nameA = isAIMv2(a) ? a.persona.title : a.characterName
          const nameB = isAIMv2(b) ? b.persona.title : b.characterName
          return nameA.localeCompare(nameB)
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "completion":
          return getCompletionPercentage(b) - getCompletionPercentage(a)
        case "version":
          const versionA = isAIMv2(a) ? 2 : 1
          const versionB = isAIMv2(b) ? 2 : 1
          return versionB - versionA
        default:
          return 0
      }
    })

    setFilteredFiles(filtered)
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(fileId)
    } else {
      newSelected.delete(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(filteredFiles.map((file) => file.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const handleBulkExport = () => {
    if (selectedFiles.size === 0) return

    const selectedAIMFiles = filteredFiles.filter((file) => selectedFiles.has(file.id))
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "2.0", // Updated version
      files: selectedAIMFiles,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sugartown-aim-v2-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedFiles.size} AIM file(s)? This action cannot be undone.`)) {
      selectedFiles.forEach((fileId) => {
        AIMStorage.deleteFile(fileId) // Uses unified delete method
      })
      setSelectedFiles(new Set())
      loadAIMFiles()
    }
  }

  const handleImport = () => {
    try {
      const importData = JSON.parse(importText)

      // Handle both single file and bulk export formats
      const filesToImport = importData.files ? importData.files : [importData]

      let importedCount = 0
      let migratedCount = 0

      filesToImport.forEach((fileData: any) => {
        try {
          if (fileData.version === "aim-2") {
            // Import v2 file directly
            const result = AIMStorage.importV2File(fileData)
            if (result.success) importedCount++
          } else {
            // Import v1 file and optionally migrate
            const aimFile = AIMStorage.import(JSON.stringify(fileData))
            aimFile.id = `aim-${aimFile.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            aimFile.updatedAt = new Date().toISOString()
            AIMStorage.save(aimFile)
            importedCount++

            // Offer migration
            if (confirm(`Migrate "${aimFile.characterName}" to AIM v2 format?`)) {
              const migrationResult = AIMMigration.migrateV1ToV2(aimFile)
              if (migrationResult.success && migrationResult.aimv2) {
                AIMStorage.saveV2(migrationResult.aimv2)
                migratedCount++
              }
            }
          }
        } catch (error) {
          console.error("Failed to import file:", error)
        }
      })

      const message =
        migratedCount > 0
          ? `Successfully imported ${importedCount} AIM file(s) and migrated ${migratedCount} to v2 format`
          : `Successfully imported ${importedCount} AIM file(s)`

      alert(message)
      setImportText("")
      setShowImportDialog(false)
      loadAIMFiles()
    } catch (error) {
      alert("Failed to import AIM files. Please check the format and try again.")
    }
  }

  const exportReadableFormat = (file: AIMFileOrV2) => {
    let readableContent = ""

    if (isAIMv2(file)) {
      readableContent = `
# ${file.persona.title} - Character Profile (AIM v2)
**Token ID: ${file.subject.tokenId}** | **Collection: ${file.subject.collectionName}**
*Generated on ${new Date().toLocaleDateString()}*

## NFT Information
- **Chain:** ${file.subject.chain}
- **Contract:** ${file.subject.contract}
- **Token ID:** ${file.subject.tokenId}
- **Collection:** ${file.subject.collectionName}

## Canonical Traits (NFT Metadata)
${Object.entries(file.canonical.traits)
  .map(([key, value]) => `- **${key.replace(/_/g, " ")}:** ${value}`)
  .join("\n")}

${
  file.ui.crystallizedKeys.length > 0
    ? `## Crystallized Traits
${file.ui.crystallizedKeys.map((key) => `- **${key.replace(/_/g, " ")}** ✨`).join("\n")}
`
    : ""
}

## Persona
- **Title:** ${file.persona.title}
${file.persona.nickname ? `- **Nickname:** "${file.persona.nickname}"` : ""}
${file.persona.alignment ? `- **Alignment:** ${file.persona.alignment}` : ""}
${file.persona.tone ? `- **Tone:** ${file.persona.tone}` : ""}

${file.persona.tags.length > 0 ? `**Tags:** ${file.persona.tags.join(", ")}\n` : ""}

${
  file.persona.lore
    ? `## Lore & Backstory
${file.persona.lore}
`
    : ""
}

${
  Object.keys(file.persona.traitsAdd).length > 0
    ? `## Additional Traits
${Object.entries(file.persona.traitsAdd)
  .map(([key, value]) => `- **${key.replace(/_/g, " ")}:** ${value}`)
  .join("\n")}
`
    : ""
}

## Goals & Aspirations
${file.persona.goals.currentQuest ? `**Current Quest:** ${file.persona.goals.currentQuest}\n` : ""}
${file.persona.goals.shortTerm.length > 0 ? `**Short-term Goals:**\n${file.persona.goals.shortTerm.map((g) => `- ${g}`).join("\n")}\n` : ""}
${file.persona.goals.longTerm.length > 0 ? `**Long-term Goals:**\n${file.persona.goals.longTerm.map((g) => `- ${g}`).join("\n")}\n` : ""}
${file.persona.goals.dreams.length > 0 ? `**Dreams:**\n${file.persona.goals.dreams.map((d) => `- ${d}`).join("\n")}\n` : ""}

---
*AIM Version: v2 | Last Updated: ${new Date(file.updatedAt).toLocaleDateString()}*
      `.trim()
    } else {
      // Original v1 export format
      readableContent = `
# ${file.characterName} - Character Profile (AIM v1)
**Ora #${file.oraNumber}**
*Generated on ${new Date().toLocaleDateString()}*

## Core Identity
- **Name:** ${file.characterName}
${file.nickname ? `- **Nickname:** "${file.nickname}"` : ""}
${file.age ? `- **Age:** ${file.age}` : ""}
${file.species ? `- **Species:** ${file.species}` : ""}
- **Alignment:** ${file.personality.alignment}
- **Social Style:** ${file.behavior.socialStyle}

## Personality Matrix
${file.personality.temperament ? `**Temperament:** ${file.personality.temperament}\n` : ""}
${file.personality.primaryTraits.length > 0 ? `**Primary Traits:** ${file.personality.primaryTraits.join(", ")}\n` : ""}
${file.personality.secondaryTraits.length > 0 ? `**Secondary Traits:** ${file.personality.secondaryTraits.join(", ")}\n` : ""}
${file.personality.motivations.length > 0 ? `**Motivations:**\n${file.personality.motivations.map((m) => `- ${m}`).join("\n")}\n` : ""}
${file.personality.fears.length > 0 ? `**Fears:**\n${file.personality.fears.map((f) => `- ${f}`).join("\n")}\n` : ""}
${file.personality.quirks.length > 0 ? `**Quirks:** ${file.personality.quirks.join(", ")}\n` : ""}

## Background & History
${file.backstory.origin ? `**Origin Story:**\n${file.backstory.origin}\n` : ""}
${file.backstory.childhood ? `**Childhood:**\n${file.backstory.childhood}\n` : ""}
${file.backstory.formativeEvents.length > 0 ? `**Formative Events:**\n${file.backstory.formativeEvents.map((e) => `- ${e}`).join("\n")}\n` : ""}
${file.backstory.achievements.length > 0 ? `**Achievements:**\n${file.backstory.achievements.map((a) => `- ${a}`).join("\n")}\n` : ""}
${file.backstory.failures.length > 0 ? `**Failures & Setbacks:**\n${file.backstory.failures.map((f) => `- ${f}`).join("\n")}\n` : ""}

## Abilities & Skills
${file.abilities.strengths.length > 0 ? `**Strengths:**\n${file.abilities.strengths.map((s) => `- ${s}`).join("\n")}\n` : ""}
${file.abilities.weaknesses.length > 0 ? `**Weaknesses:**\n${file.abilities.weaknesses.map((w) => `- ${w}`).join("\n")}\n` : ""}
${file.abilities.specialPowers.length > 0 ? `**Special Powers:** ${file.abilities.specialPowers.join(", ")}\n` : ""}

## Behavioral Patterns
${file.behavior.speechPatterns ? `**Speech Patterns:** ${file.behavior.speechPatterns}\n` : ""}
${file.behavior.mannerisms.length > 0 ? `**Mannerisms:**\n${file.behavior.mannerisms.map((m) => `- ${m}`).join("\n")}\n` : ""}
${file.behavior.habits.length > 0 ? `**Habits:**\n${file.behavior.habits.map((h) => `- ${h}`).join("\n")}\n` : ""}

## Goals & Aspirations
${file.goals.currentQuest ? `**Current Quest:** ${file.goals.currentQuest}\n` : ""}
${file.goals.shortTerm.length > 0 ? `**Short-term Goals:**\n${file.goals.shortTerm.map((g) => `- ${g}`).join("\n")}\n` : ""}
${file.goals.longTerm.length > 0 ? `**Long-term Goals:**\n${file.goals.longTerm.map((g) => `- ${g}`).join("\n")}\n` : ""}
${file.goals.dreams.length > 0 ? `**Dreams:**\n${file.goals.dreams.map((d) => `- ${d}`).join("\n")}\n` : ""}

${file.notes ? `## Additional Notes\n${file.notes}\n` : ""}

---
*Profile Version: ${file.version} | Last Updated: ${new Date(file.updatedAt).toLocaleDateString()}*
      `.trim()
    }

    const filename = isAIMv2(file) ? `${file.persona.title}-Profile-v2.md` : `${file.characterName}-Profile.md`
    const blob = new Blob([readableContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 hover:bg-slate-100/80"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AIM Management
                  </h1>
                  <p className="text-slate-600 text-lg">
                    {aimFiles.length} character profiles
                    <span className="text-sm ml-2">
                      ({aimFiles.filter((f) => !isAIMv2(f)).length} v1, {aimFiles.filter((f) => isAIMv2(f)).length} v2)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/80 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 border-slate-300 hover:border-emerald-400 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900">Import AIM Files</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="importText" className="text-sm font-medium text-slate-700">
                        Paste AIM JSON data:
                      </Label>
                      <Textarea
                        id="importText"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Paste your exported AIM JSON data here..."
                        rows={10}
                        className="font-mono text-sm mt-2 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={!importText.trim()}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedFiles.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleBulkExport}
                    className="bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-slate-300 hover:border-blue-400 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export ({selectedFiles.size})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedFiles.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by character name, token ID, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white/80"
                />
              </div>

              <div className="flex gap-3">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-44 h-12 bg-white/80 border-slate-200 focus:border-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="name">Character Name</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="version">Version</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-36 h-12 bg-white/80 border-slate-200 focus:border-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm">
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="complete">Complete (80%+)</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="v2">AIM v2</SelectItem>
                    <SelectItem value="v1">AIM v1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredFiles.length > 0 && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedFiles.size === filteredFiles.length}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Select All ({selectedFiles.size}/{filteredFiles.length})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AIM Files Grid */}
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFiles.map((file) => {
              const completion = getCompletionPercentage(file)
              const isSelected = selectedFiles.has(file.id)
              const isV2 = isAIMv2(file)
              const characterName = isV2 ? file.persona.title : file.characterName
              const tokenId = isV2 ? file.subject.tokenId : file.oraNumber
              const imageUrl = isV2 ? file.sources.image : file.oraImage
              const alignment = isV2 ? file.persona.alignment : file.personality.alignment
              const tags = isV2 ? file.persona.tags : file.tags

              return (
                <Card
                  key={file.id}
                  className={`group overflow-hidden transition-all duration-300 border-slate-200/50 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 ${
                    isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/50 shadow-lg" : ""
                  }`}
                >
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                          className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <div className="relative">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={characterName}
                            className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-white group-hover:ring-indigo-200 transition-all duration-300"
                          />
                          {completion >= 80 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -left-1">
                            <Badge
                              className={`text-xs px-1 py-0.5 ${
                                isV2
                                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                              }`}
                            >
                              v{isV2 ? "2" : "1"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors duration-300 flex items-center gap-2">
                            {characterName}
                            {isV2 && file.ui.crystallizedKeys.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Sparkles className="w-2 h-2 mr-1" />
                                {file.ui.crystallizedKeys.length}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-slate-600 font-medium">
                            {isV2 ? `Token #${tokenId}` : `Ora #${tokenId}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pb-6">
                    {/* Completion Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">AIM Completion</span>
                        <span className="text-sm font-bold text-slate-900">{completion}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            completion >= 80
                              ? "bg-gradient-to-r from-emerald-500 to-green-500"
                              : completion >= 50
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                : "bg-gradient-to-r from-red-500 to-rose-500"
                          }`}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>Updated: {new Date(file.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>Alignment: {alignment || "Not set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        <span>Version: AIM {isV2 ? "v2" : "v1"}</span>
                        {isV2 && file.ui.crystallizedKeys.length > 0 && (
                          <span className="text-amber-600">• {file.ui.crystallizedKeys.length} crystallized</span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                            +{tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 gap-3">
                      <div className="flex gap-2">
                        <Link href={`/character/${tokenId}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 bg-transparent hover:bg-emerald-50 border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 transition-all duration-200"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportReadableFormat(file)}
                          className="flex items-center gap-2 bg-transparent hover:bg-blue-50 border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 transition-all duration-200"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </Button>
                        {!isV2 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Migrate "${characterName}" to AIM v2 format?`)) {
                                const migrationResult = AIMMigration.migrateV1ToV2(file as AIMFile)
                                if (migrationResult.success && migrationResult.aimv2) {
                                  AIMStorage.saveV2(migrationResult.aimv2)
                                  loadAIMFiles()
                                  alert("Migration successful!")
                                } else {
                                  alert("Migration failed: " + migrationResult.errors.join(", "))
                                }
                              }
                            }}
                            className="flex items-center gap-2 bg-transparent hover:bg-purple-50 border-slate-300 hover:border-purple-400 text-slate-700 hover:text-purple-700 transition-all duration-200"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            Migrate
                          </Button>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete AIM file for ${characterName}?`)) {
                            AIMStorage.deleteFile(file.id)
                            loadAIMFiles()
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <FileText className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {aimFiles.length === 0 ? "No AIM Files Found" : "No Files Match Your Search"}
            </h2>
            <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto leading-relaxed">
              {aimFiles.length === 0
                ? "Create your first character profile by going to the dashboard and selecting an Ora NFT."
                : "Try adjusting your search terms or filters to find the AIM files you're looking for."}
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
