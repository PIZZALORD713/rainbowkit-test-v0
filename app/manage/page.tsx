// Local profile manager for saved AIM files.
// Filter/sort/metrics are memoized to keep the list responsive.
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AIMFile } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Download, Upload, Trash2, Eye, FileText, ArrowLeft, Calendar, User, Sparkles } from "lucide-react"
import Link from "next/link"

export default function ManagePage() {
  const router = useRouter()
  const [aimFiles, setAimFiles] = useState<AIMFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<AIMFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"name" | "created" | "updated" | "completion">("updated")
  const [filterBy, setFilterBy] = useState<"all" | "complete" | "incomplete">("all")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")

  useEffect(() => {
    loadAIMFiles()
  }, [])

  useEffect(() => {
    filterAndSortFiles()
  }, [aimFiles, searchQuery, sortBy, filterBy])

  const loadAIMFiles = () => {
    const files = AIMStorage.getAll()
    setAimFiles(files)
  }

  const getCompletionPercentage = (aimFile: AIMFile) => {
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

  const filterAndSortFiles = () => {
    let filtered = [...aimFiles]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          file.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.oraNumber.includes(searchQuery) ||
          file.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Apply completion filter
    if (filterBy === "complete") {
      filtered = filtered.filter((file) => getCompletionPercentage(file) >= 80)
    } else if (filterBy === "incomplete") {
      filtered = filtered.filter((file) => getCompletionPercentage(file) < 80)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.characterName.localeCompare(b.characterName)
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case "completion":
          return getCompletionPercentage(b) - getCompletionPercentage(a)
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
      version: "1.0",
      files: selectedAIMFiles,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sugartown-aim-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedFiles.size} AIM file(s)? This action cannot be undone.`)) {
      selectedFiles.forEach((fileId) => {
        AIMStorage.delete(fileId)
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
      filesToImport.forEach((fileData: any) => {
        try {
          const aimFile = AIMStorage.import(JSON.stringify(fileData))
          // Generate new ID to avoid conflicts
          aimFile.id = `aim-${aimFile.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          aimFile.updatedAt = new Date().toISOString()
          AIMStorage.save(aimFile)
          importedCount++
        } catch (error) {
          console.error("Failed to import file:", error)
        }
      })

      alert(`Successfully imported ${importedCount} AIM file(s)`)
      setImportText("")
      setShowImportDialog(false)
      loadAIMFiles()
    } catch (error) {
      alert("Failed to import AIM files. Please check the format and try again.")
    }
  }

  const exportReadableFormat = (file: AIMFile) => {
    const readableContent = `
# ${file.characterName} - Character Profile
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

    const blob = new Blob([readableContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${file.characterName}-Profile.md`
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
                  <p className="text-slate-600 text-lg">{aimFiles.length} character profiles</p>
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
                  placeholder="Search by character name, Ora number, or tags..."
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
                            src={file.oraImage || "/placeholder.svg"}
                            alt={file.characterName}
                            className="w-14 h-14 rounded-xl object-cover shadow-md ring-2 ring-white group-hover:ring-indigo-200 transition-all duration-300"
                          />
                          {completion >= 80 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors duration-300">
                            {file.characterName}
                          </CardTitle>
                          <p className="text-sm text-slate-600 font-medium">Ora #{file.oraNumber}</p>
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
                        <span>Alignment: {file.personality.alignment}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {file.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">
                            +{file.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 gap-3">
                      <div className="flex gap-2">
                        <Link href={`/character/${file.oraNumber}`}>
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
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Delete AIM file for ${file.characterName}?`)) {
                            AIMStorage.delete(file.id)
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
