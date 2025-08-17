"use client"

import { useState } from "react"
import { useAccount, useEnsName } from "wagmi"
import CustomConnectButton from "@/components/custom-connect-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Wallet, ExternalLink, Sparkles, User, FileText, Eye, Settings } from "lucide-react"
import { AIMEditor } from "@/components/aim-editor"
import { AIMStorage } from "@/lib/aim-storage"
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

export default function SugartownOraDashboard() {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const [searchQuery, setSearchQuery] = useState("")
  const [oras, setOras] = useState<Ora[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchedWallet, setSearchedWallet] = useState("")
  const [selectedOra, setSelectedOra] = useState<Ora | null>(null)
  const [showAIMEditor, setShowAIMEditor] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedOras, setSelectedOras] = useState<Ora[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)

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

  const handleSearchConnectedWallet = () => {
    if (address) {
      handleSearch(address)
    }
  }

  const handleOpenAIMEditor = (ora: Ora) => {
    setSelectedOra(ora)
    setShowAIMEditor(true)
  }

  const handleCloseAIMEditor = () => {
    setShowAIMEditor(false)
    setSelectedOra(null)
  }

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

  const hasAIMFile = (oraNumber: string) => {
    return AIMStorage.getByOraNumber(oraNumber) !== null
  }

  const aimFileCount = AIMStorage.getAll().length

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
                <p className="text-sm text-slate-600">Avatar Identity Model</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {aimFileCount > 0 && (
                <Link href="/manage">
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Settings className="w-4 h-4" />
                    Manage AIM Files ({aimFileCount})
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={() => {
                  setSelectionMode((prev) => !prev)
                  setSelectedOras([])
                }}
              >
                {selectionMode ? "Exit Bulk Edit" : "Bulk Edit AIM"}
              </Button>
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
            Discover Your Ora Collection and Define Your Avatar Identity Model
          </h2>
          <p className="text-xl text-slate-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            AIM is the soul of your Ora — craft personality, backstory, goals and behaviour in one place.
          </p>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Explore your unique Sugartown Ora NFTs and create detailed character profiles with our Avatar Identity Model
            system.
          </p>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Wallet
                </TabsTrigger>
                <TabsTrigger value="connected" className="flex items-center gap-2" disabled={!isConnected}>
                  <Wallet className="w-4 h-4" />
                  My Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <p className="text-slate-600 mb-4">Enter your wallet address or ENS to start editing your AIM.</p>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Enter wallet address or ENS name (e.g., vitalik.eth)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 text-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="h-14 px-8 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="connected" className="space-y-4">
                {isConnected ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Connected Wallet</p>
                          <p className="text-sm text-slate-600">
                            {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSearchConnectedWallet}
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        {loading ? "Loading..." : "Load My Oras"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">Connect your wallet to view your Ora collection</p>
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900">Ora Collection ({oras.length})</h3>
                <p className="text-slate-600 mt-1">
                  {searchedWallet &&
                    `Found in wallet: ${searchedWallet.length > 20 ? `${searchedWallet.slice(0, 6)}...${searchedWallet.slice(-4)}` : searchedWallet}`}
                </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {oras.map((ora) => (
                <Card
                  key={ora.oraNumber}
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-slate-200/50 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:scale-[1.02] hover:-translate-y-1"
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
                      className="absolute top-3 left-3 z-20 w-5 h-5 text-indigo-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  )}

                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    <img
                      src={ora.image || "/placeholder.svg?height=400&width=400&text=Ora"}
                      alt={ora.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/95 text-slate-800 font-bold text-sm px-3 py-1 shadow-lg backdrop-blur-sm">
                        #{ora.oraNumber}
                      </Badge>
                    </div>
                    {hasAIMFile(ora.oraNumber) && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm px-3 py-1 shadow-lg">
                          AIM ✓
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
                      {ora.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 pb-6 space-y-5">
                    {Object.keys(ora.traits).length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Traits</p>
                        <div className="space-y-2">
                          {Object.entries(ora.traits)
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between py-1">
                                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                  {key}
                                </span>
                                <Badge className={`text-xs font-medium ${getTraitColor(key)}`}>{value}</Badge>
                              </div>
                            ))}
                          {Object.keys(ora.traits).length > 3 && (
                            <div className="text-center pt-1">
                              <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
                                +{Object.keys(ora.traits).length - 3} more traits
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`space-y-3 pt-2 ${selectionMode ? "opacity-50 pointer-events-none" : ""}`}>
                      {/* OpenSea button - secondary action */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 h-10 bg-transparent hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 transition-all duration-200"
                        onClick={() => window.open(ora.openseaUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on OpenSea
                      </Button>

                      {/* Primary AIM actions */}
                      {hasAIMFile(ora.oraNumber) ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/character/${ora.oraNumber}`} className="flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => handleOpenAIMEditor(ora)}
                          >
                            <FileText className="w-4 h-4" />
                            Edit AIM
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                          onClick={() => handleOpenAIMEditor(ora)}
                        >
                          <FileText className="w-4 h-4" />
                          Create AIM Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* AIM Info Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Avatar Identity Model (AIM)</h3>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
              Transform your Ora NFTs into rich, interactive characters with detailed personality profiles, backstories,
              and behavioral traits using our advanced AIM system.
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

      {/* AIM Editor Modal */}
      {showAIMEditor && selectedOra && (
        <AIMEditor
          oraNumber={selectedOra.oraNumber}
          oraName={selectedOra.name}
          oraImage={selectedOra.image}
          onClose={handleCloseAIMEditor}
          onSave={() => {
            console.log("AIM file saved successfully")
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
    </div>
  )
}
