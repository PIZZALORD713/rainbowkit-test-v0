"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import type { AIMFile } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Edit, Download, User, Zap, Target, Brain, BookOpen, Sparkles } from "lucide-react"

export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const oraNumber = params.oraNumber as string

  const [aimFile, setAimFile] = useState<AIMFile | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (oraNumber) {
      const file = AIMStorage.getByOraNumber(oraNumber)
      setAimFile(file)
      setLoading(false)
    }
  }, [oraNumber])

  const handleEdit = () => {
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    const updatedFile = AIMStorage.getByOraNumber(oraNumber)
    setAimFile(updatedFile)
  }

  const handleExport = () => {
    if (!aimFile) return

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

  const getAlignmentColor = (alignment: string) => {
    const colors = {
      "Lawful Good": "bg-blue-100 text-blue-800 border-blue-200",
      "Neutral Good": "bg-green-100 text-green-800 border-green-200",
      "Chaotic Good": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Lawful Neutral": "bg-gray-100 text-gray-800 border-gray-200",
      "True Neutral": "bg-slate-100 text-slate-800 border-slate-200",
      "Chaotic Neutral": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Lawful Evil": "bg-red-100 text-red-800 border-red-200",
      "Neutral Evil": "bg-purple-100 text-purple-800 border-purple-200",
      "Chaotic Evil": "bg-pink-100 text-pink-800 border-pink-200",
    }
    return colors[alignment as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl animate-pulse mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Character Profile</h2>
          <p className="text-slate-600">Please wait while we fetch the AIM data...</p>
        </div>
      </div>
    )
  }

  if (!aimFile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 flex items-center gap-2 hover:bg-white/60">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <User className="w-16 h-16 text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">No AIM Profile Found</h2>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              This Ora doesn't have an Avatar Identity Model yet. Create one to build a detailed character profile with personality, backstory, and goals.
            </p>
            <Button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const completionPercentage = getCompletionPercentage(aimFile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => router.back()} 
                className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={aimFile.oraImage || "/placeholder.svg"}
                    alt={aimFile.characterName}
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{aimFile.characterName}</h1>
                  <p className="text-lg text-slate-600">Ora #{aimFile.oraNumber}</p>
                  <p className="text-sm text-slate-500">Avatar Identity Model</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="bg-white/80 hover:bg-white border-slate-300 hover:border-slate-400 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export AIM
              </Button>
              <Button 
                onClick={handleEdit}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Character Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Enhanced Character Portrait & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {/* Character Image with Gradient Overlay */}
                <div className="relative">
                  <img
                    src={aimFile.oraImage || "/placeholder.svg"}
                    alt={aimFile.characterName}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white mb-1">{aimFile.characterName}</h2>
                    {aimFile.nickname && <p className="text-white/90 text-lg">"{aimFile.nickname}"</p>}
                  </div>
                </div>

                {/* Character Details */}
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <Badge className={`${getAlignmentColor(aimFile.personality.alignment)} px-4 py-2 text-sm font-semibold border`}>
                      {aimFile.personality.alignment}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {aimFile.age && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">Age</span>
                        <span className="font-semibold text-slate-900">{aimFile.age}</span>
                      </div>
                    )}
                    {aimFile.species && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600 font-medium">Species</span>
                        <span className="font-semibold text-slate-900">{aimFile.species}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Social Style</span>
                      <span className="font-semibold text-slate-900">{aimFile.behavior.socialStyle}</span>
                    </div>
                  </div>

                  {/* Enhanced Progress Section */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-slate-700">Profile Completion</span>
                      <span className="text-lg font-bold text-indigo-600">{completionPercentage}%</span>
                    </div>
                    <Progress 
                      value={completionPercentage} 
                      className="h-3 bg-white/60"
                    />
                    <p className="text-xs text-slate-600 mt-2">
                      {completionPercentage >= 80 ? "Profile is comprehensive!" : 
                       completionPercentage >= 50 ? "Good progress, keep building!" : 
                       "Just getting started"}
                    </p>
                  </div>

                  {/* Enhanced Tags */}
                  {aimFile.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-3">Character Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {aimFile.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 transition-colors">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Character Details */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personality" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg border border-slate-200/50">
                <TabsTrigger value="personality" className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Personality</span>
                </TabsTrigger>
                <TabsTrigger value="backstory" className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Backstory</span>
                </TabsTrigger>
                <TabsTrigger value="abilities" className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Abilities</span>
                </TabsTrigger>
                <TabsTrigger value="behavior" className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Behavior</span>
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Goals</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personality" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      Personality Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {aimFile.personality.temperament && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <h4 className="font-bold text-slate-900 mb-3 text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          Temperament
                        </h4>
                        <p className="text-slate-700 text-lg leading-relaxed">{aimFile.personality.temperament}</p>
                      </div>
                    )}

                    {aimFile.personality.primaryTraits.length > 0 && (
\
