"use client"

import { useState } from "react"
import type { CMPFile } from "@/types/cmp"
import { CMPStorage } from "@/lib/cmp-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Plus, Save, Download } from "lucide-react"

interface CMPEditorProps {
  oraNumber: string
  oraName: string
  oraImage: string
  onSave?: (cmpFile: CMPFile) => void
  onClose?: () => void
}

export function CMPEditor({ oraNumber, oraName, oraImage, onSave, onClose }: CMPEditorProps) {
  const [cmpFile, setCmpFile] = useState<CMPFile>(() => {
    const existing = CMPStorage.getByOraNumber(oraNumber)
    if (existing) return existing

    return {
      id: `cmp-${oraNumber}-${Date.now()}`,
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
      version: 1,
    }
  })

  const handleSave = () => {
    CMPStorage.save(cmpFile)
    onSave?.(cmpFile)
  }

  const handleExport = () => {
    try {
      const jsonString = CMPStorage.export(cmpFile.id)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cmpFile.characterName}-CMP.json`
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

    setCmpFile((prev) => {
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
    setCmpFile((prev) => {
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
    let current: any = cmpFile
    for (const key of keys) {
      current = current[key]
    }
    const items = current as string[]

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
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
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((item, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {item}
              <button type="button" onClick={() => removeFromArray(path, index)} className="ml-1 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-4">
            <img src={oraImage || "/placeholder.svg"} alt={oraName} className="w-12 h-12 rounded-lg object-cover" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">CMP Editor</h2>
              <p className="text-slate-600">
                {oraName} #{oraNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="backstory">Backstory</TabsTrigger>
                <TabsTrigger value="abilities">Abilities</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>

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
                          value={cmpFile.characterName}
                          onChange={(e) => setCmpFile((prev) => ({ ...prev, characterName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nickname">Nickname</Label>
                        <Input
                          id="nickname"
                          value={cmpFile.nickname || ""}
                          onChange={(e) => setCmpFile((prev) => ({ ...prev, nickname: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={cmpFile.age || ""}
                          onChange={(e) =>
                            setCmpFile((prev) => ({ ...prev, age: Number.parseInt(e.target.value) || undefined }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="species">Species</Label>
                        <Input
                          id="species"
                          value={cmpFile.species || ""}
                          onChange={(e) => setCmpFile((prev) => ({ ...prev, species: e.target.value }))}
                        />
                      </div>
                    </div>
                    <ArrayInput path="tags" placeholder="Add tag..." label="Tags" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personality" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personality Matrix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Alignment</Label>
                        <Select
                          value={cmpFile.personality.alignment}
                          onValueChange={(value: any) =>
                            setCmpFile((prev) => ({
                              ...prev,
                              personality: { ...prev.personality, alignment: value },
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
                        <Input
                          id="temperament"
                          value={cmpFile.personality.temperament}
                          onChange={(e) =>
                            setCmpFile((prev) => ({
                              ...prev,
                              personality: { ...prev.personality, temperament: e.target.value },
                            }))
                          }
                          placeholder="e.g., Calm, Fiery, Melancholic..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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

                    <div className="grid grid-cols-2 gap-6">
                      <ArrayInput path="personality.motivations" placeholder="Add motivation..." label="Motivations" />
                      <ArrayInput path="personality.fears" placeholder="Add fear..." label="Fears" />
                    </div>

                    <ArrayInput path="personality.quirks" placeholder="Add quirk..." label="Quirks & Habits" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="backstory" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Background & History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="origin">Origin Story</Label>
                      <Textarea
                        id="origin"
                        value={cmpFile.backstory.origin}
                        onChange={(e) =>
                          setCmpFile((prev) => ({
                            ...prev,
                            backstory: { ...prev.backstory, origin: e.target.value },
                          }))
                        }
                        placeholder="Where did this character come from? What are their roots?"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="childhood">Childhood & Early Life</Label>
                      <Textarea
                        id="childhood"
                        value={cmpFile.backstory.childhood}
                        onChange={(e) =>
                          setCmpFile((prev) => ({
                            ...prev,
                            backstory: { ...prev.backstory, childhood: e.target.value },
                          }))
                        }
                        placeholder="What was their upbringing like? Key childhood experiences?"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Abilities & Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
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
                <Card>
                  <CardHeader>
                    <CardTitle>Behavioral Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="speechPatterns">Speech Patterns</Label>
                      <Textarea
                        id="speechPatterns"
                        value={cmpFile.behavior.speechPatterns}
                        onChange={(e) =>
                          setCmpFile((prev) => ({
                            ...prev,
                            behavior: { ...prev.behavior, speechPatterns: e.target.value },
                          }))
                        }
                        placeholder="How do they speak? Accent, vocabulary, tone..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Social Style</Label>
                        <Select
                          value={cmpFile.behavior.socialStyle}
                          onValueChange={(value: any) =>
                            setCmpFile((prev) => ({
                              ...prev,
                              behavior: { ...prev.behavior, socialStyle: value },
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
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <ArrayInput path="behavior.mannerisms" placeholder="Add mannerism..." label="Mannerisms" />
                      <ArrayInput path="behavior.habits" placeholder="Add habit..." label="Habits" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Goals & Aspirations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <ArrayInput
                        path="goals.shortTerm"
                        placeholder="Add short-term goal..."
                        label="Short-term Goals"
                      />
                      <ArrayInput path="goals.longTerm" placeholder="Add long-term goal..." label="Long-term Goals" />
                    </div>

                    <ArrayInput path="goals.dreams" placeholder="Add dream..." label="Dreams & Aspirations" />

                    <div>
                      <Label htmlFor="currentQuest">Current Quest</Label>
                      <Input
                        id="currentQuest"
                        value={cmpFile.goals.currentQuest || ""}
                        onChange={(e) =>
                          setCmpFile((prev) => ({
                            ...prev,
                            goals: { ...prev.goals, currentQuest: e.target.value },
                          }))
                        }
                        placeholder="What is their current main objective?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={cmpFile.notes}
                        onChange={(e) => setCmpFile((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional notes about this character..."
                        rows={4}
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
