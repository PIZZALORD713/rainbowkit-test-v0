"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, X, Heart, RotateCcw } from "lucide-react"
import { useFilterStore } from "@/lib/store"

interface Ora {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

interface FilterBarProps {
  oras: Ora[]
  totalCount: number
  filteredCount: number
}

export function FilterBar({ oras, totalCount, filteredCount }: FilterBarProps) {
  const {
    searchNumber,
    selectedTraits,
    showFavoritesOnly,
    favorites,
    setSearchNumber,
    setTraitFilter,
    clearTraitFilter,
    clearAllFilters,
    setShowFavoritesOnly,
    getAvailableTraits,
  } = useFilterStore()

  const availableTraits = getAvailableTraits(oras)
  const hasActiveFilters = searchNumber || Object.keys(selectedTraits).length > 0 || showFavoritesOnly

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

  const getActiveFilterCount = () => {
    let count = 0
    if (searchNumber) count++
    if (showFavoritesOnly) count++
    count += Object.keys(selectedTraits).length
    return count
  }

  return (
    <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Top Row - Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by Ora number or name..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            {searchNumber && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchNumber("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={!showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(false)}
              className="h-10"
            >
              All ({totalCount})
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(true)}
              className="h-10 gap-2"
            >
              <Heart className={`h-4 w-4 ${favorites.size > 0 ? "fill-current" : ""}`} />
              Favorites ({favorites.size})
            </Button>
          </div>
        </div>

        {/* Trait Filters Row */}
        {!searchNumber && Object.keys(availableTraits).length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(availableTraits)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([traitType, values]) => (
                <Popover key={traitType}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-9 gap-2 ${
                        selectedTraits[traitType]?.length > 0
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      {traitType.replace(/_/g, " ")}
                      {selectedTraits[traitType]?.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {selectedTraits[traitType].length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{traitType.replace(/_/g, " ")}</h4>
                        {selectedTraits[traitType]?.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearTraitFilter(traitType)}
                            className="h-6 px-2 text-xs"
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
                              onCheckedChange={(checked) => handleTraitChange(traitType, value, checked as boolean)}
                            />
                            <label
                              htmlFor={`${traitType}-${value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
          </div>
        )}

        {/* Active Filters and Results */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredCount}</span> of{" "}
              <span className="font-medium">{totalCount}</span> Oras
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 gap-2 text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-3 w-3" />
                Clear all ({getActiveFilterCount()})
              </Button>
            )}
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchNumber && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchNumber}
                  <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setSearchNumber("")} />
                </Badge>
              )}
              {showFavoritesOnly && (
                <Badge variant="secondary" className="gap-1">
                  <Heart className="h-3 w-3 fill-current" />
                  Favorites
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-600"
                    onClick={() => setShowFavoritesOnly(false)}
                  />
                </Badge>
              )}
              {Object.entries(selectedTraits).map(([traitType, values]) =>
                values.map((value) => (
                  <Badge key={`${traitType}-${value}`} variant="secondary" className="gap-1">
                    {traitType}: {value}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => handleTraitChange(traitType, value, false)}
                    />
                  </Badge>
                )),
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
