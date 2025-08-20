// High-level editor for AIM v2 files.
// Split UI: read-only "NFT Traits (Locked)" section and editable "Persona" section
// Enforces that persona.traitsAdd cannot override canonical.traits
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, X, Save, Download, Upload, Lock, User, BookOpen, Target, AlertTriangle, Sparkles } from "lucide-react"
import type { AIMv2, AIMFile, AIMFileOrV2 } from "@/types/aim"
import { createEmptyAIMv2 } from "@/types/aim-v2"
import { AIMStorage } from "@/lib/aim-storage"
import { AIMMigration } from "@/lib/aim-migration"
import { ImportAIMModal } from "@/components/import-aim-modal"
import { isAIMv2 } from "@/types/aim" // Added import for isAIMv2

interface AIMEditorProps {
  oraNumber: string
  oraName: string
  oraImage: string
  onClose: () => void
  onSave: () => void
}

export function AIMEditor({ oraNumber, oraName, oraImage, onClose, onSave }: AIMEditorProps) {
  const [aimFile, setAimFile] = useState<AIMv2>(() => {
    // Try to get existing v2 file first
    const existingV2 = AIMStorage.getV2BySubject("ethereum", "unknown", oraNumber)
    if (existingV2) return existingV2

    // Check for legacy v1 file and migrate
    const existingV1 = AIMStorage.getByOraNumber(oraNumber)
    if (existingV1) {
      const migrationResult = AIMMigration.migrateV1ToV2(existingV1, {
        preserveOriginalId: false,
        defaultChain: "ethereum",
        defaultContract: "unknown",
      })
      if (migrationResult.success && migrationResult.aimv2) {
        return migrationResult.aimv2
      }
    }

    // Create new AIM v2 file
    const newFile = createEmptyAIMv2(`aim-v2-${oraNumber}-${Date.now()}`)
    newFile.subject = {
      chain: "ethereum",
      contract: "unknown",
      tokenId: oraNumber,
      collectionName: oraName,
    }
    newFile.sources.image = oraImage
    newFile.persona.title = oraName
    return newFile
  })

  const [activeTab, setActiveTab] = useState("canonical")
  const [newTraitKey, setNewTraitKey] = useState("")
  const [newTraitValue, setNewTraitValue] = useState("")
  const [newTag, setNewTag] = useState("")
  const [traitConflictError, setTraitConflictError] = useState("")
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    const conflicts = AIMMigration.validateTraitsAdd(aimFile.canonical.traits, aimFile.persona.traitsAdd)
    if (conflicts.length > 0) {
      setTraitConflictError(`Trait conflicts detected: ${conflicts.join(", ")}`)
    } else {
      setTraitConflictError("")
    }
  }, [aimFile.canonical.traits, aimFile.persona.traitsAdd])

  const handleSave = () => {
    const updatedFile = { ...aimFile, updatedAt: new Date().toISOString() }
    AIMStorage.saveV2(updatedFile)
    onSave()
    onClose()
  }

  const handleExport = () => {
    try {
      const jsonString = AIMStorage.exportV2(aimFile.id)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${aimFile.persona.title}-AIM-v2.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleImportSuccess = (importedFile: AIMFileOrV2) => {
    if (isAIMv2(importedFile)) {
      setAimFile(importedFile)
    } else {
      // Migrate v1 to v2
      const migrationResult = AIMMigration.migrateV1ToV2(importedFile as AIMFile)
      if (migrationResult.success && migrationResult.aimv2) {
        setAimFile(migrationResult.aimv2)
      }
    }
    onSave()
  }

  const addPersonaTrait = () => {
    if (!newTraitKey.trim() || !newTraitValue.trim()) return

    const key = newTraitKey.trim().toLowerCase().replace(/\s+/g, "_")

    // Check for conflicts with canonical traits
    if (key in aimFile.canonical.traits) {
      setTraitConflictError(`Cannot add "${key}" - conflicts with canonical trait`)
      return
    }

    setAimFile((prev) => ({
      ...prev,
      persona: {
        ...prev.persona,
        traitsAdd: {
          ...prev.persona.traitsAdd,
          [key]: newTraitValue.trim(),
        },
      },
    }))

    setNewTraitKey("")
    setNewTraitValue("")
    setTraitConflictError("")
  }

  const removePersonaTrait = (key: string) => {
    setAimFile((prev) => {
      const updatedTraitsAdd = { ...prev.persona.traitsAdd }
      delete updatedTraitsAdd[key]
      return {
        ...prev,
        persona: {
          ...prev.persona,
          traitsAdd: updatedTraitsAdd,
        },
      }
    })
  }

  const addToArray = (field: string, value: string) => {
    if (!value.trim()) return

    setAimFile((prev) => ({
      ...prev,
      persona: {
        ...prev.persona,
        [field]: [...(prev.persona[field] as string[]), value.trim()],
      },
    }))
  }

  const removeFromArray = (field: string, index: number) => {
    setAimFile((prev) => ({
      ...prev,
      persona: {
        ...prev.persona,
        [field]: (prev.persona[field] as string[]).filter((_, i) => i !== index),
      },
    }))
  }

  return (
    <TooltipProvider>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <img
                src={aimFile.sources.image || "/placeholder.svg"}
                alt={aimFile.persona.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              AIM v2 Editor - {aimFile.persona.title}
              <Badge variant="secondary" className="ml-2">
                v2
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="canonical" className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    <span className="hidden sm:inline">NFT Traits</span>
                  </TabsTrigger>
                  <TabsTrigger value="persona" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Persona</span>
                  </TabsTrigger>
                  <TabsTrigger value="lore" className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Lore</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Goals</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  <TabsContent value="canonical" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-slate-500" />
                          NFT Traits (Locked)
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                          These traits come from the NFT metadata and cannot be edited.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.keys(aimFile.canonical.traits).length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <p>No canonical traits available.</p>
                            <p className="text-sm">Traits will appear here when NFT metadata is fetched.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(aimFile.canonical.traits).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-600">{value}</span>
                                  {aimFile.ui.crystallizedKeys.includes(key) && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Crystallized trait - highlighted as important</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {aimFile.ui.crystallizedKeys.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Crystallized Traits</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aimFile.ui.crystallizedKeys.map((key) => (
                                <Badge key={key} className="bg-amber-100 text-amber-800">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {key.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>NFT Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Collection</Label>
                            <p className="text-sm text-slate-600">{aimFile.subject.collectionName}</p>
                          </div>
                          <div>
                            <Label>Token ID</Label>
                            <p className="text-sm text-slate-600">{aimFile.subject.tokenId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Chain</Label>
                            <p className="text-sm text-slate-600 capitalize">{aimFile.subject.chain}</p>
                          </div>
                          <div>
                            <Label>Contract</Label>
                            <p className="text-sm text-slate-600 font-mono text-xs">{aimFile.subject.contract}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="persona" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Character Persona</CardTitle>
                        <p className="text-sm text-slate-600">
                          Customize your character's personality and additional traits.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title">Character Title</Label>
                            <Input
                              id="title"
                              value={aimFile.persona.title}
                              onChange={(e) =>
                                setAimFile((prev) => ({
                                  ...prev,
                                  persona: { ...prev.persona, title: e.target.value },
                                }))
                              }
                              placeholder="Enter character title..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="nickname">Nickname</Label>
                            <Input
                              id="nickname"
                              value={aimFile.persona.nickname || ""}
                              onChange={(e) =>
                                setAimFile((prev) => ({
                                  ...prev,
                                  persona: { ...prev.persona, nickname: e.target.value },
                                }))
                              }
                              placeholder="Enter nickname..."
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="alignment">Alignment</Label>
                          <Select
                            value={aimFile.persona.alignment || "True Neutral"}
                            onValueChange={(value) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: { ...prev.persona, alignment: value as any },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lawful Good">Lawful Good</SelectItem>
                              <SelectItem value="Neutral Good">Neutral Good</SelectItem>
                              <SelectItem value="Chaotic Good">Chaotic Good</SelectItem>
                              <SelectItem value="Lawful Neutral">Lawful Neutral</SelectItem>
                              <SelectItem value="True Neutral">True Neutral</SelectItem>
                              <SelectItem value="Chaotic Neutral">Chaotic Neutral</SelectItem>
                              <SelectItem value="Lawful Evil">Lawful Evil</SelectItem>
                              <SelectItem value="Neutral Evil">Neutral Evil</SelectItem>
                              <SelectItem value="Chaotic Evil">Chaotic Evil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tone">Personality Tone</Label>
                          <Textarea
                            id="tone"
                            value={aimFile.persona.tone}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: { ...prev.persona, tone: e.target.value },
                              }))
                            }
                            placeholder="Describe their overall personality and temperament..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Tags</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a tag..."
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addToArray("tags", newTag)
                                  setNewTag("")
                                }
                              }}
                            />
                            <Button
                              onClick={() => {
                                addToArray("tags", newTag)
                                setNewTag("")
                              }}
                              size="sm"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aimFile.persona.tags.map((tag, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800">
                                {tag}
                                <button
                                  onClick={() => removeFromArray("tags", index)}
                                  className="ml-2 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Traits</CardTitle>
                        <p className="text-sm text-slate-600">
                          Add custom traits that don't conflict with canonical NFT traits.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {traitConflictError && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{traitConflictError}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Input
                            value={newTraitKey}
                            onChange={(e) => setNewTraitKey(e.target.value)}
                            placeholder="Trait name..."
                            className="flex-1"
                          />
                          <Input
                            value={newTraitValue}
                            onChange={(e) => setNewTraitValue(e.target.value)}
                            placeholder="Trait value..."
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addPersonaTrait()
                              }
                            }}
                          />
                          <Button onClick={addPersonaTrait} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {Object.keys(aimFile.persona.traitsAdd).length > 0 && (
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(aimFile.persona.traitsAdd).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-600">{value}</span>
                                  <button
                                    onClick={() => removePersonaTrait(key)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="lore" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Character Lore</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="lore">Backstory & Lore</Label>
                          <Textarea
                            id="lore"
                            value={aimFile.persona.lore}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: { ...prev.persona, lore: e.target.value },
                              }))
                            }
                            placeholder="Write your character's backstory, history, and lore..."
                            rows={8}
                            className="mt-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Goals & Aspirations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentQuest">Current Quest</Label>
                          <Input
                            id="currentQuest"
                            value={aimFile.persona.goals.currentQuest || ""}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: {
                                  ...prev.persona,
                                  goals: { ...prev.persona.goals, currentQuest: e.target.value },
                                },
                              }))
                            }
                            placeholder="What are they currently focused on..."
                          />
                        </div>
                        <div>
                          <Label>Short-term Goals</Label>
                          <Textarea
                            value={aimFile.persona.goals.shortTerm.join("\n")}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: {
                                  ...prev.persona,
                                  goals: {
                                    ...prev.persona.goals,
                                    shortTerm: e.target.value.split("\n").filter((g) => g.trim()),
                                  },
                                },
                              }))
                            }
                            placeholder="Enter short-term goals (one per line)..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Long-term Dreams</Label>
                          <Textarea
                            value={aimFile.persona.goals.longTerm.join("\n")}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: {
                                  ...prev.persona,
                                  goals: {
                                    ...prev.persona.goals,
                                    longTerm: e.target.value.split("\n").filter((g) => g.trim()),
                                  },
                                },
                              }))
                            }
                            placeholder="Enter long-term goals (one per line)..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Ultimate Dreams</Label>
                          <Textarea
                            value={aimFile.persona.goals.dreams.join("\n")}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                persona: {
                                  ...prev.persona,
                                  goals: {
                                    ...prev.persona.goals,
                                    dreams: e.target.value.split("\n").filter((g) => g.trim()),
                                  },
                                },
                              }))
                            }
                            placeholder="Enter ultimate dreams and aspirations (one per line)..."
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          <div className="flex justify-between items-center p-6 border-t bg-slate-50">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export AIM v2
              </Button>
              <Button variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import AIM
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save AIM v2
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImportAIMModal open={showImport} onClose={() => setShowImport(false)} onImportSuccess={handleImportSuccess} />
    </TooltipProvider>
  )
}
