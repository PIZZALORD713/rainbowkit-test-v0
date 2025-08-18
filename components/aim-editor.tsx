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
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <img src={oraImage || "/placeholder.svg"} alt={oraName} className="w-12 h-12 rounded-lg object-cover" />
              AIM Editor - {aimFile.characterName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="identity" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Identity</span>
                  </TabsTrigger>
                  <TabsTrigger value="personality" className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Personality</span>
                  </TabsTrigger>
                  <TabsTrigger value="backstory" className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Backstory</span>
                  </TabsTrigger>
                  <TabsTrigger value="abilities" className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Abilities</span>
                  </TabsTrigger>
                  <TabsTrigger value="behavior" className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Behavior</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Goals</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  <TabsContent value="identity" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Core Identity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="characterName">Character Name</Label>
                            <Input
                              id="characterName"
                              value={aimFile.characterName}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, characterName: e.target.value }))}
                              placeholder="Enter character name..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="nickname">Nickname</Label>
                            <Input
                              id="nickname"
                              value={aimFile.nickname || ""}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, nickname: e.target.value }))}
                              placeholder="Enter nickname..."
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="age">Age</Label>
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
                            />
                          </div>
                          <div>
                            <Label htmlFor="species">Species</Label>
                            <Input
                              id="species"
                              value={aimFile.species || ""}
                              onChange={(e) => setAimFile((prev) => ({ ...prev, species: e.target.value }))}
                              placeholder="Enter species..."
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="personality" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personality Matrix</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label htmlFor="alignment">Alignment</Label>
                          <Select
                            value={aimFile.personality.alignment}
                            onValueChange={(value) =>
                              setAimFile((prev) => ({
                                ...prev,
                                personality: { ...prev.personality, alignment: value as any },
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
                          <Label htmlFor="temperament">Temperament</Label>
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
                          />
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Personality Axes</h4>
                          <div className="space-y-4">
                            <div>
                              <Label>Bravery ↔ Caution</Label>
                              <div className="px-3 py-2">
                                <Slider
                                  value={braveryLevel}
                                  onValueChange={setBraveryLevel}
                                  max={10}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                  <span>Cautious</span>
                                  <span>Balanced</span>
                                  <span>Brave</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Empathy ↔ Logic</Label>
                              <div className="px-3 py-2">
                                <Slider
                                  value={empathyLevel}
                                  onValueChange={setEmpathyLevel}
                                  max={10}
                                  min={1}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                  <span>Logical</span>
                                  <span>Balanced</span>
                                  <span>Empathetic</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                            <p>📊 Radar chart coming soon - visualize all personality dimensions at once!</p>
                          </div>
                        </div>

                        <div>
                          <Label>Primary Traits</Label>
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
                            />
                            <Button
                              onClick={() => {
                                addToArray("primaryTraits", newTrait, "personality")
                                setNewTrait("")
                              }}
                              size="sm"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {aimFile.personality.primaryTraits.map((trait, index) => (
                              <Badge key={index} className="bg-indigo-100 text-indigo-800">
                                {trait}
                                <button
                                  onClick={() => removeFromArray("primaryTraits", index, "personality")}
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
                  </TabsContent>

                  <TabsContent value="backstory" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Background & History</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="origin">Origin Story</Label>
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="childhood">Childhood & Early Life</Label>
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
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-slate-500" />
                          Memory Timeline (Coming Soon)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-slate-500">
                          <p className="mb-4">Add significant moments in your Ora's story</p>
                          <Button disabled variant="outline">
                            Add Memory Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="abilities" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Abilities & Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Strengths</Label>
                          <Textarea placeholder="List their key strengths and abilities..." rows={3} />
                        </div>
                        <div>
                          <Label>Weaknesses</Label>
                          <Textarea placeholder="What are their limitations or vulnerabilities..." rows={3} />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Behavioral Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="speechPatterns">Speech Patterns</Label>
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="socialStyle">Social Style</Label>
                          <Select
                            value={aimFile.behavior.socialStyle}
                            onValueChange={(value) =>
                              setAimFile((prev) => ({
                                ...prev,
                                behavior: { ...prev.behavior, socialStyle: value as any },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                    <Card>
                      <CardHeader>
                        <CardTitle>Goals & Aspirations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentQuest">Current Quest</Label>
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
                          />
                        </div>
                        <div>
                          <Label>Short-term Goals</Label>
                          <Textarea placeholder="What do they want to achieve soon..." rows={3} />
                        </div>
                        <div>
                          <Label>Long-term Dreams</Label>
                          <Textarea placeholder="Their ultimate aspirations and dreams..." rows={3} />
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
                Export AIM (.aim)
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
