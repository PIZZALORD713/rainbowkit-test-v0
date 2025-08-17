"use client"

import { useState } from "react"
import type { AIMFile } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Save, Download, User, Brain, BookOpen, Zap, Target, Sparkles } from "lucide-react"

interface AIMEditorProps {
  oraNumber: string
  oraName: string
  oraImage: string
  onSave?: (aimFile: AIMFile) => void
  onClose?: () => void
}

export function AIMEditor({ oraNumber, oraName, oraImage, onSave, onClose }: AIMEditorProps) {
  const [aimFile, setAimFile] = useState<AIMFile>(() => {
    const existing = AIMStorage.getByOraNumber(oraNumber)
    if (existing) return existing

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
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      AIMStorage.save(aimFile)
      onSave?.(aimFile)

      // Show success feedback
      const button = document.querySelector("[data-save-button]") as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = "Saved!"
        button.classList.add("bg-green-600", "hover:bg-green-700")
        setTimeout(() => {
          button.textContent = originalText
          button.classList.remove("bg-green-600", "hover:bg-green-700")
        }, 2000)
      }
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    try {
      const jsonString = AIMStorage.export(aimFile.id)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${aimFile.characterName}-AIM.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const addToArray = (path: string, value: string) => {
    if (!value.trim()) return

    setAimFile((prev) => {
      const newFile = { ...prev }
      const keys = path.split(".")
      let current: any = newFile

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      const finalKey = keys[keys.length - 1]
      if (!current[finalKey].includes(value.trim())) {
        current[finalKey] = [...current[finalKey], value.trim()]
      }

      return newFile
    })
  }

  const removeFromArray = (path: string, index: number) => {
    setAimFile((prev) => {
      const newFile = { ...prev }
      const keys = path.split(".")
      let current: any = newFile

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      const finalKey = keys[keys.length - 1]
      current[finalKey] = current[finalKey].filter((_: any, i: number) => i !== index)

      return newFile
    })
  }

  const ArrayInput = ({ path, placeholder, label }: { path: string; placeholder: string; label: string }) => {
    const [inputValue, setInputValue] = useState("")
    const keys = path.split(".")
    let current: any = aimFile
    for (const key of keys) {
      current = current[key]
    }
    const items = current as string[]

    return (
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700">{label}</Label>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addToArray(path, inputValue)
                setInputValue("")
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              addToArray(path, inputValue)
              setInputValue("")
            }}
            className="px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                <span className="text-sm">{item}</span>
                <button
                  type="button"
                  onClick={() => removeFromArray(path, index)}
                  className="ml-1 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabConfig = [
    { id: "identity", label: "Identity", icon: User, color: "text-blue-600" },
    { id: "personality", label: "Personality", icon: Brain, color: "text-purple-600" },
    { id: "backstory", label: "Backstory", icon: BookOpen, color: "text-green-600" },
    { id: "abilities", label: "Abilities", icon: Zap, color: "text-yellow-600" },
    { id: "behavior", label: "Behavior", icon: Sparkles, color: "text-pink-600" },
    { id: "goals", label: "Goals", icon: Target, color: "text-red-600" },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-slate-200">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={oraImage || "/placeholder.svg"}
                  alt={oraName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">AIM Editor</h2>
                <p className="text-white/90 text-lg">
                  {oraName} #{oraNumber}
                </p>
                <p className="text-white/70 text-sm">Avatar Identity Model</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                data-save-button
                className="bg-white text-indigo-600 hover:bg-white/90 font-semibold shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save AIM"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-8 bg-slate-100 p-1 rounded-2xl">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <Icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : "text-slate-500"}`} />
                      <span className="hidden sm:inline font-medium">{tab.label}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="identity" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="w-5 h-5 text-blue-600" />
                      Core Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="characterName" className="text-sm font-semibold text-slate-700">
                          Character Name
                        </Label>
                        <Input
                          id="characterName"
                          value={aimFile.characterName}
                          onChange={(e) => setAimFile((prev) => ({ ...prev, characterName: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-sm font-semibold text-slate-700">
                          Nickname
                        </Label>
                        <Input
                          id="nickname"
                          value={aimFile.nickname || ""}
                          onChange={(e) => setAimFile((prev) => ({ ...prev, nickname: e.target.value }))}
                          placeholder="Optional nickname or alias"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-sm font-semibold text-slate-700">
                          Age
                        </Label>
                        <Input
                          id="age"
                          type="number"
                          value={aimFile.age || ""}
                          onChange={(e) =>
                            setAimFile((prev) => ({ ...prev, age: Number.parseInt(e.target.value) || undefined }))
                          }
                          placeholder="Character's age"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="species" className="text-sm font-semibold text-slate-700">
                          Species
                        </Label>
                        <Input
                          id="species"
                          value={aimFile.species || ""}
                          onChange={(e) => setAimFile((prev) => ({ ...prev, species: e.target.value }))}
                          placeholder="Human, Elf, Robot, etc."
                          className="h-11"
                        />
                      </div>
                    </div>
                    <ArrayInput path="tags" placeholder="Add a tag..." label="Tags" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personality" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Personality Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Moral Alignment</Label>
                        <Select
                          value={aimFile.personality.alignment}
                          onValueChange={(value: any) =>
                            setAimFile((prev) => ({
                              ...prev,
                              personality: { ...prev.personality, alignment: value },
                            }))
                          }
                        >
                          <SelectTrigger className="h-11">
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
                      <div className="space-y-2">
                        <Label htmlFor="temperament" className="text-sm font-semibold text-slate-700">
                          Temperament
                        </Label>
                        <Input
                          id="temperament"
                          value={aimFile.personality.temperament}
                          onChange={(e) =>
                            setAimFile((prev) => ({
                              ...prev,
                              personality: { ...prev.personality, temperament: e.target.value },
                            }))
                          }
                          placeholder="e.g., Calm, Fiery, Melancholic, Optimistic"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput
                        path="personality.primaryTraits"
                        placeholder="Add primary trait..."
                        label="Primary Traits"
                      />
                      <ArrayInput
                        path="personality.secondaryTraits"
                        placeholder="Add secondary trait..."
                        label="Secondary Traits"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput path="personality.motivations" placeholder="Add motivation..." label="Motivations" />
                      <ArrayInput path="personality.fears" placeholder="Add fear..." label="Fears" />
                    </div>

                    <ArrayInput path="personality.quirks" placeholder="Add quirk..." label="Quirks & Habits" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="backstory" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Background & History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="origin" className="text-sm font-semibold text-slate-700">
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
                        placeholder="Where did this character come from? What's their origin story?"
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="childhood" className="text-sm font-semibold text-slate-700">
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
                        placeholder="What was their upbringing like? Key childhood experiences?"
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput
                        path="backstory.formativeEvents"
                        placeholder="Add formative event..."
                        label="Formative Events"
                      />
                      <ArrayInput path="backstory.achievements" placeholder="Add achievement..." label="Achievements" />
                    </div>

                    <ArrayInput
                      path="backstory.failures"
                      placeholder="Add failure/setback..."
                      label="Failures & Setbacks"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="abilities" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Abilities & Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput path="abilities.strengths" placeholder="Add strength..." label="Strengths" />
                      <ArrayInput path="abilities.weaknesses" placeholder="Add weakness..." label="Weaknesses" />
                    </div>

                    <ArrayInput
                      path="abilities.specialPowers"
                      placeholder="Add special power..."
                      label="Special Powers"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Sparkles className="w-5 h-5 text-pink-600" />
                      Behavioral Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="speechPatterns" className="text-sm font-semibold text-slate-700">
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
                        placeholder="How do they speak? Accent, vocabulary, tone, catchphrases..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Social Style</Label>
                        <Select
                          value={aimFile.behavior.socialStyle}
                          onValueChange={(value: any) =>
                            setAimFile((prev) => ({
                              ...prev,
                              behavior: { ...prev.behavior, socialStyle: value },
                            }))
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Extroverted">Extroverted</SelectItem>
                            <SelectItem value="Introverted">Introverted</SelectItem>
                            <SelectItem value="Ambivert">Ambivert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput path="behavior.mannerisms" placeholder="Add mannerism..." label="Mannerisms" />
                      <ArrayInput path="behavior.habits" placeholder="Add habit..." label="Habits" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6 mt-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Target className="w-5 h-5 text-red-600" />
                      Goals & Aspirations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ArrayInput
                        path="goals.shortTerm"
                        placeholder="Add short-term goal..."
                        label="Short-term Goals"
                      />
                      <ArrayInput path="goals.longTerm" placeholder="Add long-term goal..." label="Long-term Goals" />
                    </div>

                    <ArrayInput path="goals.dreams" placeholder="Add dream..." label="Dreams & Aspirations" />

                    <div className="space-y-2">
                      <Label htmlFor="currentQuest" className="text-sm font-semibold text-slate-700">
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
                        placeholder="What is their current main objective or mission?"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={aimFile.notes}
                        onChange={(e) => setAimFile((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional notes, ideas, or details about this character..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
