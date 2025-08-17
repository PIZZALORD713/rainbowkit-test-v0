"use client"

import { useState, useEffect } from "react"
import { useAccount, useEnsName } from "wagmi"
import CustomConnectButton from "@/components/custom-connect-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ExternalLink, Sparkles, User, FileText, Eye, Settings, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { CMPEditor } from "@/components/cmp-editor"
import { CMPStorage } from "@/lib/cmp-storage"
import BulkEditModal from "@/components/bulk-edit-modal"
import Link from "next/link"

interface Ora {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

interface ApiResponse {
  success: boolean
  data?: {
    wallet: string
    ensName?: string
    totalOras: number
    oras: Ora[]
    collectionInfo: {
      name: string
      contractAddress: string
      blockchain: string
    }
  }
  message: string
  error?: string
}

const SugartownOraDashboard = () => {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const [activeTab, setActiveTab] = useState<"search" | "my">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [oras, setOras] = useState<Ora[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchedWallet, setSearchedWallet] = useState("")
  const [selectedOra, setSelectedOra] = useState<Ora | null>(null)
  const [showCMPEditor, setShowCMPEditor] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedOras, setSelectedOras] = useState<Ora[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  const handleOpenCMPEditor = (ora: Ora) => {
    setSelectedOra(ora)
    setShowCMPEditor(true)
  }

  const handleCloseCMPEditor = () => {
    setShowCMPEditor(false)
    setSelectedOra(null)
  }

  const handleSearch = async (walletToSearch?: string) => {
    const targetWallet = walletToSearch || searchQuery.trim()

    if (!targetWallet) {
      setError("Please enter a wallet address or ENS name")
      return
    }

    setLoading(true)
    setError("")
    setSearchedWallet(targetWallet)

    try {
      const response = await fetch(`/api/chatgpt/oras?address=${encodeURIComponent(targetWallet)}`)
      const data: ApiResponse = await response.json()

      if (data.success && data.data) {
        setOras(data.data.oras)
        if (data.data.oras.length === 0) {
          setError("No Sugartown Oras found for this wallet")
        }
      } else {
        setError(data.error || "Failed to fetch NFTs")
        setOras([])
      }
    } catch (err) {
      setError("Failed to fetch NFTs. Please try again.")
      setOras([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      setActiveTab("my")
      setSearchedWallet((prev) => prev || address)
    }
  }, [isConnected, address])

  useEffect(() => {
    const w = (searchedWallet || "").trim()
    if (!w) return

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/chatgpt/oras?address=${encodeURIComponent(w)}`)
        const data: ApiResponse = await response.json()

        if (!cancelled) {
          if (data.success && data.data) {
            setOras(data.data.oras)
            if (data.data.oras.length === 0) {
              setError("No Sugartown Oras found for this wallet")
            }
          } else {
            setError(data.error || "Failed to fetch NFTs")
            setOras([])
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to fetch NFTs. Please try again.")
          setOras([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchedWallet])

  const getTraitColor = (traitType: string) => {
    const colors = {
      Background: "bg-emerald-100 text-emerald-800",
      Clothing: "bg-blue-100 text-blue-800",
      Eyes: "bg-amber-100 text-amber-800",
      "Face Accessory": "bg-rose-100 text-rose-800",
      Head: "bg-violet-100 text-violet-800",
      "Left Hand": "bg-cyan-100 text-cyan-800",
      Mouth: "bg-orange-100 text-orange-800",
      "Right Hand": "bg-teal-100 text-teal-800",
      Special: "bg-pink-100 text-pink-800",
      Type: "bg-indigo-100 text-indigo-800",
    }
    return colors[traitType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const hasCMPFile = (oraNumber: string) => {
    return CMPStorage.getByOraNumber(oraNumber) !== null
  }

  const cmpFileCount = CMPStorage.getAll().length

  const handleImportCMP = () => {
    if (!importText.trim()) {
      setImportStatus({ type: "error", message: "Please paste JSON data to import" })
      return
    }

    try {
      const importData = JSON.parse(importText)
      let importedCount = 0
      const errors: string[] = []

      if (importData.format === "standardized-cmp" && importData.characters && Array.isArray(importData.characters)) {
        importData.characters.forEach((character: any, index: number) => {
          try {
            // This is already in the correct CMP format, just need to ensure unique ID
            const cmpFile = {
              ...character,
              id: `cmp-${character.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              updatedAt: new Date().toISOString(),
            }
            CMPStorage.save(cmpFile)
            importedCount++
          } catch (error) {
            errors.push(
              `Character ${index + 1} (${character.oraNumber}): ${error instanceof Error ? error.message : "Unknown error"}`,
            )
          }
        })
      }
      // Handle character profile format (array with tokenId, archetype, alignment, etc.)
      else if (Array.isArray(importData) && importData.length > 0 && importData[0].tokenId && importData[0].archetype) {
        importData.forEach((profile: any, index: number) => {
          try {
            // Map character profile to CMP structure
            const cmpFile = {
              id: `cmp-${profile.tokenId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              oraNumber: profile.tokenId,
              oraName: `Sugartown Oras #${profile.tokenId}`,
              oraImage: `/placeholder.svg?height=400&width=400&text=Ora+${profile.tokenId}`,
              characterName: profile.archetype || `Character ${profile.tokenId}`,
              nickname: "",
              age: undefined,
              species: "",
              personality: {
                primaryTraits: [profile.archetype || "Unknown"],
                secondaryTraits: [],
                alignment: profile.alignment || "True Neutral",
                temperament: profile.tone || "",
                motivations: [],
                fears: [],
                quirks: [],
              },
              backstory: {
                origin: profile.lore || "",
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
                speechPatterns: profile.catchphrase || "",
                mannerisms: [],
                habits: [],
                socialStyle: "Ambivert" as const,
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
                currentQuest: "",
              },
              tags: [profile.tagline || "imported"].filter(Boolean),
              notes: `Imported character profile on ${new Date().toLocaleDateString()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: 3,
            }

            CMPStorage.save(cmpFile)
            importedCount++
          } catch (error) {
            errors.push(
              `Character ${index + 1} (${profile.tokenId}): ${error instanceof Error ? error.message : "Unknown error"}`,
            )
          }
        })
      }
      // Handle legacy bulk export format
      else if (importData.characters && Array.isArray(importData.characters)) {
        // This is a legacy bulk export format
        importData.characters.forEach((character: any, index: number) => {
          try {
            // Create a basic CMP file structure from legacy bulk export data
            const cmpFile = {
              id: `cmp-${character.tokenId || character.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              oraNumber: character.tokenId || character.oraNumber || `unknown-${index}`,
              oraName: character.oraName || `Sugartown Oras #${character.tokenId || character.oraNumber}`,
              oraImage: character.imageUrl || character.image || "",
              characterName: character.currentName || character.name || `Character ${index + 1}`,
              nickname: "",
              age: undefined,
              species: "",
              personality: {
                primaryTraits: [],
                secondaryTraits: [],
                temperament: "",
                motivations: [],
                fears: [],
                quirks: [],
                alignment: "True Neutral" as const,
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
                socialStyle: "Ambivert" as const,
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
                currentQuest: "",
              },
              tags: ["imported"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: 3,
            }

            CMPStorage.save(cmpFile)
            importedCount++
          } catch (error) {
            errors.push(`Character ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        })
      }
      // Handle individual CMP file format
      else if (importData.id && importData.oraNumber && importData.characterName) {
        try {
          const cmpFile = CMPStorage.import(importText)
          // Generate new ID to avoid conflicts
          cmpFile.id = `cmp-${cmpFile.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          cmpFile.updatedAt = new Date().toISOString()
          CMPStorage.save(cmpFile)
          importedCount++
        } catch (error) {
          errors.push(`CMP file: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }
      // Handle array of CMP files
      else if (Array.isArray(importData) && importData.length > 0 && importData[0].id && importData[0].oraNumber) {
        importData.forEach((fileData: any, index: number) => {
          try {
            const cmpFile = CMPStorage.import(JSON.stringify(fileData))
            cmpFile.id = `cmp-${cmpFile.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            cmpFile.updatedAt = new Date().toISOString()
            CMPStorage.save(cmpFile)
            importedCount++
          } catch (error) {
            errors.push(`File ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        })
      }
      // Handle export format with files array
      else if (importData.files && Array.isArray(importData.files)) {
        importData.files.forEach((fileData: any, index: number) => {
          try {
            const cmpFile = CMPStorage.import(JSON.stringify(fileData))
            cmpFile.id = `cmp-${cmpFile.oraNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            cmpFile.updatedAt = new Date().toISOString()
            CMPStorage.save(cmpFile)
            importedCount++
          } catch (error) {
            errors.push(`File ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        })
      } else {
        throw new Error(
          "Unrecognized JSON format. Please ensure you're importing a valid CMP export file or character profile array.",
        )
      }

      if (importedCount > 0) {
        setImportStatus({
          type: "success",
          message: `Successfully imported ${importedCount} CMP file(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ""}`,
        })
        setImportText("")
        // Close dialog after 2 seconds
        setTimeout(() => {
          setShowImportDialog(false)
          setImportStatus({ type: null, message: "" })
        }, 2000)
      } else {
        setImportStatus({
          type: "error",
          message: `Import failed: ${errors.length > 0 ? errors[0] : "No valid files found"}`,
        })
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : "Invalid JSON format"}`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Sugartown Ora Dashboard</h1>
                <p className="text-sm text-slate-600">Character Modeling Protocol</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cmpFileCount > 0 && (
                <Link href="/manage">
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Settings className="w-4 h-4" />
                    Manage CMP Files ({cmpFileCount})
                  </Button>
                </Link>
              )}
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Discover Your Ora Collection
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Explore your unique Sugartown Ora NFTs and create detailed character spec sheets with our advanced Character
            Modeling Protocol (CMP)
          </p>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "my")}>
              <div className="flex items-center gap-3">
                <TabsList>
                  <TabsTrigger value="search" className="min-w-[110px]">
                    Search Wallet
                  </TabsTrigger>
                  <TabsTrigger value="my" className="min-w-[110px]" disabled={!isConnected}>
                    My Wallet
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 flex items-center gap-2">
                  <Input
                    placeholder="Search wallet (0x… or ens.eth)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (() => {
                        setSearchedWallet(searchQuery.trim())
                        setActiveTab("search")
                      })()
                    }
                    className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Button
                    onClick={() => {
                      setSearchedWallet(searchQuery.trim())
                      setActiveTab("search")
                    }}
                  >
                    Search
                  </Button>

                  {isConnected && address && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchedWallet(address)
                        setActiveTab("my")
                      }}
                      aria-label="Use my wallet"
                    >
                      Use my wallet
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="my" className="mt-4">
                {!isConnected ? (
                  <div className="min-h-[160px] grid place-items-center rounded-lg border">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-slate-600">Connect your wallet to load your Oras.</p>
                      <CustomConnectButton />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loading && (
                      <div className="text-center py-8">
                        <p className="text-slate-600">Loading your Oras...</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="mt-4">
                <div className="space-y-4">
                  {loading && (
                    <div className="text-center py-8">
                      <p className="text-slate-600">Searching...</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {oras.length > 0 && (
          <div className="mb-12">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Ora Collection ({oras.length})</h2>
                {searchedWallet && <p className="text-sm text-slate-500">Found in wallet: {searchedWallet}</p>}
              </div>

              <div className="shrink-0 flex gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(true)} className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import CMP File
                </Button>
                <Button
                  variant={selectionMode ? "outline" : "default"}
                  onClick={() => {
                    setSelectionMode((prev) => !prev)
                    setSelectedOras([]) // reset any previous selection when toggling
                  }}
                  aria-label={selectionMode ? "Exit Bulk Edit" : "Enter Bulk Edit"}
                >
                  {selectionMode ? "Exit Bulk Edit" : "Bulk Edit CMP"}
                </Button>
              </div>
            </div>

            {selectionMode && (
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <span className="text-sm text-slate-600">
                  {selectedOras.length} of {oras.length} selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOras(oras)}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOras([])}>
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowBulkModal(true)}
                    disabled={!selectedOras.length}
                  >
                    Export Selected ({selectedOras.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectionMode(false)
                      setSelectedOras([])
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {oras.map((ora) => (
                <Card
                  key={ora.oraNumber}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200/50 bg-white/60 backdrop-blur-sm hover:bg-white/80"
                >
                  {selectionMode && (
                    <input
                      type="checkbox"
                      aria-label={`Select ${ora.name}`}
                      checked={selectedOras.some((o) => o.oraNumber === ora.oraNumber)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSelectedOras((prev) =>
                          checked ? [...prev, ora] : prev.filter((o) => o.oraNumber !== ora.oraNumber),
                        )
                      }}
                      className="absolute top-2 left-2 z-20 w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500"
                    />
                  )}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={ora.image || "/placeholder.svg?height=400&width=400&text=Ora"}
                      alt={ora.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-slate-800 font-semibold">#{ora.oraNumber}</Badge>
                    </div>
                    {hasCMPFile(ora.oraNumber) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-green-500 text-white font-semibold">CMP</Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ora.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {Object.keys(ora.traits).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Traits:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(ora.traits)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <Badge key={key} className={`text-xs ${getTraitColor(key)}`}>
                                {key}: {value}
                              </Badge>
                            ))}
                          {Object.keys(ora.traits).length > 4 && (
                            <Badge className="text-xs bg-slate-100 text-slate-600">
                              +{Object.keys(ora.traits).length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between pt-2 gap-2 ${selectionMode ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-transparent hover:bg-indigo-50 hover:border-indigo-300 flex-1"
                        onClick={() => window.open(ora.openseaUrl, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3" />
                        OpenSea
                      </Button>

                      {hasCMPFile(ora.oraNumber) ? (
                        <div className="flex gap-1 flex-1">
                          <Link href={`/character/${ora.oraNumber}`} className="flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full flex items-center gap-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            onClick={() => handleOpenCMPEditor(ora)}
                          >
                            <FileText className="w-3 h-3" />
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-1"
                          onClick={() => handleOpenCMPEditor(ora)}
                        >
                          <FileText className="w-3 h-3" />
                          Create CMP
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CMP Info Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Character Modeling Protocol (CMP)</h3>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
              Transform your Ora NFTs into rich, interactive characters with detailed personality profiles, backstories,
              and behavioral traits using our advanced CMP system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <User className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Personality Matrix</h4>
              <p className="text-slate-600 leading-relaxed">
                Define core personality traits, behavioral patterns, and psychological profiles that make each Ora
                unique and memorable.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Rich Narratives</h4>
              <p className="text-slate-600 leading-relaxed">
                Create compelling backstories, origin tales, and character arcs that bring depth and meaning to your Ora
                collection.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Interactive Traits</h4>
              <p className="text-slate-600 leading-relaxed">
                Set dynamic behavioral patterns, interaction styles, and response mechanisms for immersive character
                experiences.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CMP Editor Modal */}
      {showCMPEditor && selectedOra && (
        <CMPEditor
          oraNumber={selectedOra.oraNumber}
          oraName={selectedOra.name}
          oraImage={selectedOra.image}
          onClose={handleCloseCMPEditor}
          onSave={() => {
            console.log("CMP file saved successfully")
          }}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <BulkEditModal
          selectedOras={selectedOras}
          collectionName={searchedWallet || "Sugartown Collection"}
          onClose={() => setShowBulkModal(false)}
        />
      )}

      {/* Import CMP Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CMP File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              <p className="mb-2">Import character profiles from:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Standardized CMP Export files (new format)</li>
                <li>Character profile arrays (tokenId, archetype, alignment, etc.)</li>
                <li>Legacy Bulk CMP Export files (JSON format)</li>
                <li>Individual CMP files</li>
                <li>Arrays of CMP files</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="importText">Paste CMP JSON data:</Label>
              <Textarea
                id="importText"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your exported CMP JSON data here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {importStatus.type && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  importStatus.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {importStatus.type === "success" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{importStatus.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportText("")
                  setImportStatus({ type: null, message: "" })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleImportCMP} disabled={!importText.trim() || importStatus.type === "success"}>
                Import CMP Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SugartownOraDashboard
