"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, Save, Download, Upload, User, Brain, BookOpen, Zap, Users, Target, Clock } from "lucide-react"
import type { AIMFile } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { ImportAIMModal } from "@/components/import-aim-modal"

interface AIMEditorProps {
  oraNumber: string
  oraName: string
  oraImage: string
  onClose: () => void
  onSave: () => void
}

export function AIMEditor({ oraNumber, oraName, oraImage, onClose, onSave }: AIMEditorProps) {
  const [aimFile, setAimFile] = useState<AIMFile>(() => {
    const existing = AIMStorage.getByOraNumber(oraNumber)
    if (existing) return existing

    // Create new AIM file
    return {
      id: `aim-${oraNumber}-${Date.now()}`,
      oraNumber,
      oraName,
      oraImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterName: oraName,
      personality: {
        primaryTraits: [],
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
        distinctiveFeatures: [],
        clothing: "",
        accessories: [],
      },
      goals: {
        shortTerm: [],
        longTerm: [],
        dreams: [],
      },
      tags: [],
      notes: "",
      version: "1",
    }
  })

  const [activeTab, setActiveTab] = useState("identity")
  const [newTrait, setNewTrait] = useState("")
  const [newMotivation, setNewMotivation] = useState("")
  const [newFear, setNewFear] = useState("")
  const [newQuirk, setNewQuirk] = useState("")
  const [braveryLevel, setBraveryLevel] = useState([5])
  const [empathyLevel, setEmpathyLevel] = useState([5])
  const [showImport, setShowImport] = useState(false)

  const handleSave = () => {
    AIMStorage.save(aimFile)
    onSave()
    onClose()
  }

  const handleExport = () => {
    try {
      const jsonString = AIMStorage.export(aimFile.id)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${aimFile.characterName}-AIM.aim`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleImportSuccess = (importedFile: AIMFile) => {
    setAimFile(importedFile)
    onSave() // Trigger refresh in parent component
  }

  const addToArray = (field: string, value: string, section?: string) => {
    if (!value.trim()) return

    setAimFile((prev) => {
      const updated = { ...prev }
      if (section) {
        // @ts-ignore - Dynamic property access
        updated[section][field] = [...updated[section][field], value.trim()]
      } else {
        // @ts-ignore - Dynamic property access
        updated[field] = [...updated[field], value.trim()]
      }
      return updated
    })
  }

  const removeFromArray = (field: string, index: number, section?: string) => {
    setAimFile((prev) => {
      const updated = { ...prev }
      if (section) {
        // @ts-ignore - Dynamic property access
        updated[section][field] = updated[section][field].filter((_: any, i: number) => i !== index)
      } else {
        // @ts-ignore - Dynamic property access
        updated[field] = updated[field].filter((_: any, i: number) => i !== index)
      }
      return updated
    })
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 border-cyan-500/20 text-white">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-teal-400 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-20 left-20 w-1 h-1 bg-cyan-300 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-10 right-10 w-1 h-1 bg-teal-300 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse delay-500"></div>
            <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-teal-400 rounded-full animate-pulse delay-200"></div>
          </div>

          <DialogHeader className="p-6 pb-0 relative z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
              <img
                src={oraImage || "/placeholder.svg"}
                alt={oraName}
                className="w-12 h-12 rounded-lg object-cover border-2 border-cyan-400/30"
              />
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                AIM Editor - {aimFile.characterName}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 border border-cyan-500/20">
                  <TabsTrigger
                    value="identity"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Identity</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="personality"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Personality</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="backstory"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Backstory</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="abilities"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Abilities</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="behavior"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Behavior</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="goals"
                    className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-slate-300 hover:text-white"
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Goals</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  <TabsContent value="identity" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Core Identity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="characterName" className="text-slate-300">
                              Character Name
                            </Label>
                            <Input
                              id="characterName"
                              value={aimFile.characterName}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, characterName: e.target.value }))}
                              placeholder="Enter character name..."
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nickname" className="text-slate-300">
                              Nickname
                            </Label>
                            <Input
                              id="nickname"
                              value={aimFile.nickname || ""}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, nickname: e.target.value }))}
                              placeholder="Enter nickname..."
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="age" className="text-slate-300">
                              Age
                            </Label>
                            <Input
                              id="age"
                              type="number"
                              value={aimFile.age || ""}
                              onChange={(e) =>
                                setAimFile((prev) => ({
                                  ...prev,
                                  age: e.target.value ? Number(e.target.value) : undefined,
                                }))
                              }
                              placeholder="Enter age..."
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                            />
                          </div>
                          <div>
                            <Label htmlFor="species" className="text-slate-300">
                              Species
                            </Label>
                            <Input
                              id="species"
                              value={aimFile.species || ""}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, species: e.target.value }))}
                              placeholder="Enter species..."
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="personality" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Personality Matrix</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label htmlFor="alignment" className="text-slate-300">
                            Alignment
                          </Label>
                          <Select
                            value={aimFile.personality.alignment}
                            onValueChange={(value) =>
                              setAimFile((prev) => ({
                                ...prev,
                                personality: { ...prev.personality, alignment: value as any },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600 text-white">
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
                          <Label htmlFor="temperament" className="text-slate-300">
                            Temperament
                          </Label>
                          <Textarea
                            id="temperament"
                            value={aimFile.personality.temperament}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                personality: { ...prev.personality, temperament: e.target.value },
                              }))
                            }
                            placeholder="Describe their overall temperament and demeanor..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-cyan-400">Personality Axes</h4>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-slate-300">Bravery ↔ Caution</Label>
                              <div className="px-3 py-2">
                                <Slider
                                  value={braveryLevel}
                                  onValueChange={setBraveryLevel}
                                  max={10}
                                  min={1}
                                  step={1}
                                  className="w-full [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-400"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                  <span>Cautious</span>
                                  <span>Balanced</span>
                                  <span>Brave</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-300">Empathy ↔ Logic</Label>
                              <div className="px-3 py-2">
                                <Slider
                                  value={empathyLevel}
                                  onValueChange={setEmpathyLevel}
                                  max={10}
                                  min={1}
                                  step={1}
                                  className="w-full [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-400"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                  <span>Logical</span>
                                  <span>Balanced</span>
                                  <span>Empathetic</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-400 bg-slate-700/30 p-3 rounded-lg border border-cyan-500/20">
                            <p>📊 Radar chart coming soon - visualize all personality dimensions at once!</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-slate-300">Primary Traits</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={newTrait}
                              onChange={(e) => setNewTrait(e.target.value)}
                              placeholder="Add a primary trait..."
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addToArray("primaryTraits", newTrait, "personality")
                                  setNewTrait("")
                                }
                              }}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                            />
                            <Button
                              onClick={() => {
                                addToArray("primaryTraits", newTrait, "personality")
                                setNewTrait("")
                              }}
                              size="sm"
                              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aimFile.personality.primaryTraits.map((trait, index) => (
                              <Badge
                                key={index}
                                className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/30"
                              >
                                {trait}
                                <button
                                  onClick={() => removeFromArray("primaryTraits", index, "personality")}
                                  className="ml-2 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="backstory" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Background & History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="origin" className="text-slate-300">
                            Origin Story
                          </Label>
                          <Textarea
                            id="origin"
                            value={aimFile.backstory.origin}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                backstory: { ...prev.backstory, origin: e.target.value },
                              }))
                            }
                            placeholder="Enter a brief origin story here..."
                            rows={4}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="childhood" className="text-slate-300">
                            Childhood & Early Life
                          </Label>
                          <Textarea
                            id="childhood"
                            value={aimFile.backstory.childhood}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                backstory: { ...prev.backstory, childhood: e.target.value },
                              }))
                            }
                            placeholder="Describe their childhood and formative years..."
                            rows={4}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-400">
                          <Clock className="w-5 h-5 text-slate-400" />
                          Memory Timeline (Coming Soon)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-slate-400">
                          <p className="mb-4">Add significant moments in your Ora's story</p>
                          <Button disabled variant="outline" className="border-slate-600 text-slate-400 bg-transparent">
                            Add Memory Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="abilities" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Abilities & Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-slate-300">Strengths</Label>
                          <Textarea
                            placeholder="List their key strengths and abilities..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Weaknesses</Label>
                          <Textarea
                            placeholder="What are their limitations or vulnerabilities..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Behavioral Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="speechPatterns" className="text-slate-300">
                            Speech Patterns
                          </Label>
                          <Textarea
                            id="speechPatterns"
                            value={aimFile.behavior.speechPatterns}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                behavior: { ...prev.behavior, speechPatterns: e.target.value },
                              }))
                            }
                            placeholder="How do they speak? Any unique phrases or patterns..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="socialStyle" className="text-slate-300">
                            Social Style
                          </Label>
                          <Select
                            value={aimFile.behavior.socialStyle}
                            onValueChange={(value) =>
                              setAimFile((prev) => ({
                                ...prev,
                                behavior: { ...prev.behavior, socialStyle: value as any },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-cyan-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600 text-white">
                              <SelectItem value="Extroverted">Extroverted</SelectItem>
                              <SelectItem value="Introverted">Introverted</SelectItem>
                              <SelectItem value="Ambivert">Ambivert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-6 mt-6">
                    <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-cyan-400">Goals & Aspirations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentQuest" className="text-slate-300">
                            Current Quest
                          </Label>
                          <Input
                            id="currentQuest"
                            value={aimFile.goals.currentQuest || ""}
                            onChange={(e) =>
                              setAimFile((prev) => ({
                                ...prev,
                                goals: { ...prev.goals, currentQuest: e.target.value },
                              }))
                            }
                            placeholder="What are they currently focused on..."
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Short-term Goals</Label>
                          <Textarea
                            placeholder="What do they want to achieve soon..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Long-term Dreams</Label>
                          <Textarea
                            placeholder="Their ultimate aspirations and dreams..."
                            rows={3}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-400"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          <div className="flex justify-between items-center p-6 border-t border-cyan-500/20 bg-slate-800/30 backdrop-blur-sm relative z-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export AIM (.aim)
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import AIM
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save AIM
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImportAIMModal open={showImport} onClose={() => setShowImport(false)} onImportSuccess={handleImportSuccess} />
    </>
  )
}
