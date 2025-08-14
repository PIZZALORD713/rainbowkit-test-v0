"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import type { CMPFile } from "@/types/cmp"
import { CMPStorage } from "@/lib/cmp-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Edit, Download, Star, User, Heart, Zap, Target, Brain, BookOpen, Sparkles } from "lucide-react"
import { CMPEditor } from "@/components/cmp-editor"

export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const oraNumber = params.oraNumber as string

  const [cmpFile, setCmpFile] = useState<CMPFile | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (oraNumber) {
      const file = CMPStorage.getByOraNumber(oraNumber)
      setCmpFile(file)
      setLoading(false)
    }
  }, [oraNumber])

  const handleEdit = () => {
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    // Refresh the CMP file data
    const updatedFile = CMPStorage.getByOraNumber(oraNumber)
    setCmpFile(updatedFile)
  }

  const handleExport = () => {
    if (!cmpFile) return

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

  const getAlignmentColor = (alignment: string) => {
    const colors = {
      "Lawful Good": "bg-blue-100 text-blue-800",
      "Neutral Good": "bg-green-100 text-green-800",
      "Chaotic Good": "bg-cyan-100 text-cyan-800",
      "Lawful Neutral": "bg-gray-100 text-gray-800",
      "True Neutral": "bg-slate-100 text-slate-800",
      "Chaotic Neutral": "bg-yellow-100 text-yellow-800",
      "Lawful Evil": "bg-red-100 text-red-800",
      "Neutral Evil": "bg-purple-100 text-purple-800",
      "Chaotic Evil": "bg-pink-100 text-pink-800",
    }
    return colors[alignment as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getCompletionPercentage = (cmpFile: CMPFile) => {
    let totalFields = 0
    let filledFields = 0

    // Core identity
    totalFields += 4
    if (cmpFile.characterName) filledFields++
    if (cmpFile.nickname) filledFields++
    if (cmpFile.age) filledFields++
    if (cmpFile.species) filledFields++

    // Personality
    totalFields += 6
    if (cmpFile.personality.primaryTraits.length > 0) filledFields++
    if (cmpFile.personality.secondaryTraits.length > 0) filledFields++
    if (cmpFile.personality.temperament) filledFields++
    if (cmpFile.personality.motivations.length > 0) filledFields++
    if (cmpFile.personality.fears.length > 0) filledFields++
    if (cmpFile.personality.quirks.length > 0) filledFields++

    // Backstory
    totalFields += 4
    if (cmpFile.backstory.origin) filledFields++
    if (cmpFile.backstory.childhood) filledFields++
    if (cmpFile.backstory.formativeEvents.length > 0) filledFields++
    if (cmpFile.backstory.achievements.length > 0) filledFields++

    // Abilities
    totalFields += 3
    if (cmpFile.abilities.strengths.length > 0) filledFields++
    if (cmpFile.abilities.weaknesses.length > 0) filledFields++
    if (cmpFile.abilities.specialPowers.length > 0) filledFields++

    // Behavior
    totalFields += 3
    if (cmpFile.behavior.speechPatterns) filledFields++
    if (cmpFile.behavior.mannerisms.length > 0) filledFields++
    if (cmpFile.behavior.habits.length > 0) filledFields++

    // Goals
    totalFields += 3
    if (cmpFile.goals.shortTerm.length > 0) filledFields++
    if (cmpFile.goals.longTerm.length > 0) filledFields++
    if (cmpFile.goals.dreams.length > 0) filledFields++

    return Math.round((filledFields / totalFields) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-slate-600">Loading character...</p>
        </div>
      </div>
    )
  }

  if (!cmpFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Character Profile Found</h2>
            <p className="text-slate-600 mb-6">
              This Ora doesn't have a CMP file yet. Create one to build a detailed character profile.
            </p>
            <Button onClick={() => router.back()}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage(cmpFile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img
                  src={cmpFile.oraImage || "/placeholder.svg"}
                  alt={cmpFile.characterName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{cmpFile.characterName}</h1>
                  <p className="text-slate-600">Ora #{cmpFile.oraNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Character Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Character Portrait & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src={cmpFile.oraImage || "/placeholder.svg"}
                    alt={cmpFile.characterName}
                    className="w-48 h-48 rounded-2xl object-cover mx-auto mb-4 shadow-lg"
                  />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{cmpFile.characterName}</h2>
                  {cmpFile.nickname && <p className="text-slate-600 mb-2">"{cmpFile.nickname}"</p>}
                  <Badge className={getAlignmentColor(cmpFile.personality.alignment)}>
                    {cmpFile.personality.alignment}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {cmpFile.age && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Age:</span>
                      <span className="font-medium">{cmpFile.age}</span>
                    </div>
                  )}
                  {cmpFile.species && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Species:</span>
                      <span className="font-medium">{cmpFile.species}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Social Style:</span>
                    <span className="font-medium">{cmpFile.behavior.socialStyle}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Profile Completion</span>
                      <span className="text-sm font-medium">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                </div>

                {cmpFile.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {cmpFile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Character Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personality" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
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
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Behavior</span>
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Goals</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personality" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Personality Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cmpFile.personality.temperament && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Temperament</h4>
                        <p className="text-slate-700">{cmpFile.personality.temperament}</p>
                      </div>
                    )}

                    {cmpFile.personality.primaryTraits.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Primary Traits</h4>
                        <div className="flex flex-wrap gap-2">
                          {cmpFile.personality.primaryTraits.map((trait, index) => (
                            <Badge key={index} className="bg-indigo-100 text-indigo-800">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {cmpFile.personality.secondaryTraits.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Secondary Traits</h4>
                        <div className="flex flex-wrap gap-2">
                          {cmpFile.personality.secondaryTraits.map((trait, index) => (
                            <Badge key={index} className="bg-purple-100 text-purple-800">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cmpFile.personality.motivations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            Motivations
                          </h4>
                          <ul className="space-y-1">
                            {cmpFile.personality.motivations.map((motivation, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {motivation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cmpFile.personality.fears.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Fears</h4>
                          <ul className="space-y-1">
                            {cmpFile.personality.fears.map((fear, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {fear}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {cmpFile.personality.quirks.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                          Quirks & Habits
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cmpFile.personality.quirks.map((quirk, index) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {quirk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="backstory" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Background & History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cmpFile.backstory.origin && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Origin Story</h4>
                        <p className="text-slate-700 leading-relaxed">{cmpFile.backstory.origin}</p>
                      </div>
                    )}

                    {cmpFile.backstory.childhood && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Childhood & Early Life</h4>
                        <p className="text-slate-700 leading-relaxed">{cmpFile.backstory.childhood}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cmpFile.backstory.formativeEvents.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Formative Events</h4>
                          <ul className="space-y-1">
                            {cmpFile.backstory.formativeEvents.map((event, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {event}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cmpFile.backstory.achievements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Achievements
                          </h4>
                          <ul className="space-y-1">
                            {cmpFile.backstory.achievements.map((achievement, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {cmpFile.backstory.failures.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Failures & Setbacks</h4>
                        <ul className="space-y-1">
                          {cmpFile.backstory.failures.map((failure, index) => (
                            <li key={index} className="text-slate-700 text-sm">
                              • {failure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="abilities" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Abilities & Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cmpFile.abilities.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-green-700">Strengths</h4>
                          <ul className="space-y-1">
                            {cmpFile.abilities.strengths.map((strength, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cmpFile.abilities.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-red-700">Weaknesses</h4>
                          <ul className="space-y-1">
                            {cmpFile.abilities.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {cmpFile.abilities.specialPowers.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Special Powers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cmpFile.abilities.specialPowers.map((power, index) => (
                            <Badge key={index} className="bg-purple-100 text-purple-800">
                              {power}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Behavioral Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cmpFile.behavior.speechPatterns && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Speech Patterns</h4>
                        <p className="text-slate-700 leading-relaxed">{cmpFile.behavior.speechPatterns}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cmpFile.behavior.mannerisms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Mannerisms</h4>
                          <ul className="space-y-1">
                            {cmpFile.behavior.mannerisms.map((mannerism, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {mannerism}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cmpFile.behavior.habits.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Habits</h4>
                          <ul className="space-y-1">
                            {cmpFile.behavior.habits.map((habit, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {habit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-600" />
                      Goals & Aspirations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {cmpFile.goals.currentQuest && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-600" />
                          Current Quest
                        </h4>
                        <p className="text-slate-700">{cmpFile.goals.currentQuest}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cmpFile.goals.shortTerm.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Short-term Goals</h4>
                          <ul className="space-y-1">
                            {cmpFile.goals.shortTerm.map((goal, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cmpFile.goals.longTerm.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Long-term Goals</h4>
                          <ul className="space-y-1">
                            {cmpFile.goals.longTerm.map((goal, index) => (
                              <li key={index} className="text-slate-700 text-sm">
                                • {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {cmpFile.goals.dreams.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          Dreams & Aspirations
                        </h4>
                        <ul className="space-y-1">
                          {cmpFile.goals.dreams.map((dream, index) => (
                            <li key={index} className="text-slate-700 text-sm">
                              • {dream}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Additional Notes */}
        {cmpFile.notes && (
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{cmpFile.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* CMP Editor Modal */}
      {showEditor && (
        <CMPEditor
          oraNumber={cmpFile.oraNumber}
          oraName={cmpFile.oraName}
          oraImage={cmpFile.oraImage}
          onClose={handleCloseEditor}
          onSave={() => {
            console.log("CMP file updated successfully")
          }}
        />
      )}
    </div>
  )
}
