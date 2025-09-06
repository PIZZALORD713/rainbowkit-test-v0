"use client"

import { useState, useCallback, useEffect } from "react"
import { useAccount, useEnsName } from "wagmi"
import CustomConnectButton from "@/components/custom-connect-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Wallet, Sparkles, User, FileText, Settings, Copy, CheckCircle, Filter } from "lucide-react"
import { AIMEditor } from "@/components/aim-editor"
import { AIMStorage } from "@/lib/aim-storage"
import BulkEditModal from "@/components/bulk-edit-modal"
import HeroCarousel from "@/components/hero-carousel"
import { FilterPanel } from "@/components/filter-panel"
import { useFilterStore } from "@/lib/store"
import Link from "next/link"
import { OraCard } from "@/components/OraCard"
import ChatAgent from "@/components/chat-agent"

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
  const [aimRefreshTrigger, setAimRefreshTrigger] = useState(0)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied">("idle")
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const { getFilteredOras, toggleFavorite, isFavorite } = useFilterStore()

  useEffect(() => {
    if (isConnected && address && !loading && oras.length === 0) {
      handleSearch(address)
    }
  }, [isConnected, address])

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

  const handleCopyAll = async () => {
    setCopyStatus("copying")

    try {
      const mcpData = {
        name: "sugartown-oras",
        version: "1.0.0",
        description: "Sugartown Ora collection with Avatar Identity Models",
        characters: oras.map((ora) => {
          const aimFile = AIMStorage.getByOraNumber(ora.oraNumber)

          return {
            id: ora.oraNumber,
            name: aimFile?.characterName || ora.name,
            description: aimFile?.backstory?.origin || `${ora.name} from the Sugartown collection`,
            personality: aimFile?.personality || {
              primaryTraits: [],
              secondaryTraits: [],
              alignment: "True Neutral",
              temperament: "",
              motivations: [],
              fears: [],
              quirks: [],
            },
            backstory: aimFile?.backstory || {
              origin: "",
              childhood: "",
              formativeEvents: [],
              relationships: [],
              achievements: [],
              failures: [],
            },
            abilities: aimFile?.abilities || {
              strengths: [],
              weaknesses: [],
              specialPowers: [],
              skills: [],
            },
            behavior: aimFile?.behavior || {
              speechPatterns: "",
              mannerisms: [],
              habits: [],
              socialStyle: "Ambivert",
              conflictResolution: "",
              decisionMaking: "",
            },
            appearance: {
              ...aimFile?.appearance,
              nftImage: ora.image,
              traits: ora.traits,
            },
            goals: aimFile?.goals || {
              shortTerm: [],
              longTerm: [],
              dreams: [],
              currentQuest: "",
            },
            metadata: {
              oraNumber: ora.oraNumber,
              openseaUrl: ora.openseaUrl,
              hasAIM: !!aimFile,
              createdAt: aimFile?.createdAt,
              updatedAt: aimFile?.updatedAt,
              version: aimFile?.version || "1",
            },
          }
        }),
      }

      const formattedData = JSON.stringify(mcpData, null, 2)
      await navigator.clipboard.writeText(formattedData)

      setCopyStatus("copied")
      setTimeout(() => setCopyStatus("idle"), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      setCopyStatus("idle")
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

  const getDisplayName = useCallback(
    (ora: Ora) => {
      const aimFile = AIMStorage.getByOraNumber(ora.oraNumber)
      return aimFile?.characterName || ora.name
    },
    [aimRefreshTrigger],
  )

  const hasAIMFile = useCallback(
    (oraNumber: string) => {
      return AIMStorage.getByOraNumber(oraNumber) !== null
    },
    [aimRefreshTrigger],
  )

  const aimFileCount = AIMStorage.getAll().length + aimRefreshTrigger * 0 // Trigger recalculation

  const handleAIMSave = useCallback(() => {
    console.log("AIM file saved successfully")
    setAimRefreshTrigger((prev) => prev + 1) // Trigger re-render to show updated names
  }, [])

  const handleScrollToSearch = () => {
    document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredOras = getFilteredOras(oras)

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
                <h1 className="text-2xl font-bold text-slate-900">OraKit</h1>
                <p className="text-sm text-slate-600">Avatar Identity Model</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {aimFileCount > 0 && (
                <Link href="/manage">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 font-medium shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <Settings className="w-4 h-4" />
                    Manage AIM Files ({aimFileCount})
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white/80 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-slate-300 hover:border-purple-400 text-slate-700 hover:text-purple-700 font-medium shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
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
        <div className="mb-16">
          <HeroCarousel onSearchClick={handleScrollToSearch} onConnectedWalletClick={handleSearchConnectedWallet} />
        </div>

        {/* Search Section */}
        <div id="search-section" className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Get Started with Your Collection</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Connect your wallet or search any address to explore Sugartown Oras and create Avatar Identity Models.
            </p>
          </div>

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
                    className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="connected" className="space-y-4">
                {isConnected ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Connected Wallet</p>
                          <p className="text-sm text-slate-600">
                            {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                          </p>
                        </div>
                      </div>
                      {loading && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                          Loading ORAs...
                        </div>
                      )}
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
                <h3 className="text-3xl font-bold text-slate-900">Ora Collection ({filteredOras.length})</h3>
                <p className="text-slate-600 mt-1">
                  {searchedWallet &&
                    `Found in wallet: ${searchedWallet.length > 20 ? `${searchedWallet.slice(0, 6)}...${searchedWallet.slice(-4)}` : searchedWallet}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowFilterPanel(true)}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                <Button
                  onClick={handleCopyAll}
                  disabled={copyStatus === "copying"}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
                >
                  {copyStatus === "copying" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Copying...
                    </>
                  ) : copyStatus === "copied" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All (MCP Format)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {selectionMode && (
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <span className="text-sm text-slate-600">
                  {selectedOras.length} of {filteredOras.length} selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOras(filteredOras)}
                    className="bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOras([])}
                    className="bg-white/80 hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowBulkModal(true)}
                    disabled={!selectedOras.length}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredOras.map((ora) => (
                <OraCard
                  key={ora.oraNumber}
                  ora={ora}
                  displayName={getDisplayName(ora)}
                  hasAIM={hasAIMFile(ora.oraNumber)}
                  isFavorite={isFavorite(ora.oraNumber)}
                  isSelected={selectedOras.some((o) => o.oraNumber === ora.oraNumber)}
                  selectionMode={selectionMode}
                  onToggleFavorite={() => toggleFavorite(ora.oraNumber)}
                  onToggleSelection={(checked) => {
                    setSelectedOras((prev) =>
                      checked ? [...prev, ora] : prev.filter((o) => o.oraNumber !== ora.oraNumber),
                    )
                  }}
                  onOpenAIMEditor={() => handleOpenAIMEditor(ora)}
                />
              ))}
            </div>
          </div>
        )}

        {/* AIM Info Section */}
        <div
          id="aim-info"
          className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-200/50"
        >
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

        {/* ChatAgent Component */}
        <ChatAgent />
      </main>

      {/* AIM Editor Modal */}
      {showAIMEditor && selectedOra && (
        <AIMEditor
          oraNumber={selectedOra.oraNumber}
          oraName={selectedOra.name}
          oraImage={selectedOra.image}
          onClose={handleCloseAIMEditor}
          onSave={handleAIMSave}
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

      {/* Filter Panel */}
      <FilterPanel oras={oras} isOpen={showFilterPanel} onClose={() => setShowFilterPanel(false)} />
    </div>
  )
}
