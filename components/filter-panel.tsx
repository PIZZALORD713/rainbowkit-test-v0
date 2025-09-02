"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, X, ChevronDown, Sparkles, RotateCcw } from "lucide-react"
import { useFilterStore } from "@/lib/store"

interface Ora {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

interface FilterPanelProps {
  oras: Ora[]
  isOpen: boolean
  onClose: () => void
}

export function FilterPanel({ oras, isOpen, onClose }: FilterPanelProps) {
  const {
    searchNumber,
    selectedTraits,
    showFavoritesOnly,
    setSearchNumber,
    setTraitFilter,
    clearTraitFilter,
    clearAllFilters,
    setShowFavoritesOnly,
    getAvailableTraits,
  } = useFilterStore()

  const [minOra, setMinOra] = useState("")
  const [maxOra, setMaxOra] = useState("")

  const availableTraits = getAvailableTraits(oras)
  const hasActiveFilters =
    searchNumber || Object.keys(selectedTraits).length > 0 || showFavoritesOnly || minOra || maxOra

  const handleTraitChange = (traitType: string, value: string, checked: boolean) => {
    const currentValues = selectedTraits[traitType] || []
    let newValues: string[]

    if (checked) {
      newValues = [...currentValues, value]
    } else {
      newValues = currentValues.filter((v) => v !== value)
    }

    if (newValues.length === 0) {
      clearTraitFilter(traitType)
    } else {
      setTraitFilter(traitType, newValues)
    }
  }

  const handleApplyFilters = () => {
    // Apply range filter logic here if needed
    onClose()
  }

  const handleClearAll = () => {
    clearAllFilters()
    setMinOra("")
    setMaxOra("")
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white/20 backdrop-blur-lg border-l border-white/30 shadow-xl z-50 transform transition-transform duration-300 ease-out rounded-l-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Search by Number/Name */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Search Ora</Label>
              <Input
                placeholder="Search by number or name..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="bg-white/50 border-white/30 focus:bg-white/70 transition-colors rounded-xl"
              />
            </div>

            {/* Ora Number Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Ora Number Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Min"
                  value={minOra}
                  onChange={(e) => setMinOra(e.target.value)}
                  className="bg-white/50 border-white/30 focus:bg-white/70 transition-colors rounded-xl"
                />
                <Input
                  placeholder="Max"
                  value={maxOra}
                  onChange={(e) => setMaxOra(e.target.value)}
                  className="bg-white/50 border-white/30 focus:bg-white/70 transition-colors rounded-xl"
                />
              </div>
            </div>

            {/* Favorites Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/30 rounded-xl border border-white/20">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <Label className="text-sm font-medium text-gray-700">Favorites Only</Label>
              </div>
              <Switch
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-400 data-[state=checked]:to-orange-500"
              />
            </div>

            {/* Trait Filters */}
            {!searchNumber && Object.keys(availableTraits).length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Filter by Traits</Label>
                {Object.entries(availableTraits)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([traitType, values]) => (
                    <div key={traitType} className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between bg-white/50 border-white/30 hover:bg-white/70 transition-colors rounded-xl ${
                              selectedTraits[traitType]?.length > 0
                                ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                                : ""
                            }`}
                          >
                            <span className="capitalize">{traitType.replace(/_/g, " ")}</span>
                            <div className="flex items-center gap-2">
                              {selectedTraits[traitType]?.length > 0 && (
                                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                  {selectedTraits[traitType].length}
                                </span>
                              )}
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-white/90 backdrop-blur-lg border-white/30 rounded-xl">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm capitalize">{traitType.replace(/_/g, " ")}</h4>
                              {selectedTraits[traitType]?.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => clearTraitFilter(traitType)}
                                  className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600 rounded-lg"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {values.map((value) => (
                                <div key={value} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${traitType}-${value}`}
                                    checked={selectedTraits[traitType]?.includes(value) || false}
                                    onCheckedChange={(checked) =>
                                      handleTraitChange(traitType, value, checked as boolean)
                                    }
                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                                  />
                                  <label
                                    htmlFor={`${traitType}-${value}`}
                                    className="text-sm font-medium leading-none cursor-pointer hover:text-blue-600 transition-colors"
                                  >
                                    {value}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/20 space-y-3">
            <Button
              onClick={handleApplyFilters}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full bg-white/50 border-white/30 hover:bg-white/70 rounded-xl h-10 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
