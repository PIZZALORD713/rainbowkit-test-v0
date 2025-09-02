import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Ora {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

export interface FilterState {
  // Search and basic filters
  searchQuery: string
  searchNumber: string // Added searchNumber property for component compatibility
  minOraNumber: string
  maxOraNumber: string
  favoritesOnly: boolean
  showFavoritesOnly: boolean // Added showFavoritesOnly property for component compatibility

  // Trait filters
  selectedTraits: Record<string, string[]>

  // UI state
  isFilterPanelOpen: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setSearchNumber: (query: string) => void // Added setSearchNumber action
  setOraNumberRange: (min: string, max: string) => void
  setFavoritesOnly: (enabled: boolean) => void
  setShowFavoritesOnly: (enabled: boolean) => void // Added setShowFavoritesOnly action
  setTraitFilter: (trait: string, values: string[]) => void
  clearTraitFilter: (trait: string) => void
  clearAllFilters: () => void
  toggleFilterPanel: () => void
  setFilterPanelOpen: (open: boolean) => void

  getAvailableTraits: (oras: Ora[]) => Record<string, string[]>
  getFilteredOras: (oras: Ora[]) => Ora[] // Added missing getFilteredOras function to interface

  // Favorites management
  favorites: Set<string>
  toggleFavorite: (oraId: string) => void
  isFavorite: (oraId: string) => boolean
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchQuery: "",
      searchNumber: "", // Added searchNumber initial state
      minOraNumber: "",
      maxOraNumber: "",
      favoritesOnly: false,
      showFavoritesOnly: false, // Added showFavoritesOnly initial state
      selectedTraits: {},
      isFilterPanelOpen: false,
      favorites: new Set<string>(),

      // Actions
      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setSearchNumber: (query: string) => set({ searchNumber: query, searchQuery: query }),

      setOraNumberRange: (min: string, max: string) => set({ minOraNumber: min, maxOraNumber: max }),

      setFavoritesOnly: (enabled: boolean) => set({ favoritesOnly: enabled }),

      setShowFavoritesOnly: (enabled: boolean) => set({ showFavoritesOnly: enabled, favoritesOnly: enabled }),

      setTraitFilter: (trait: string, values: string[]) =>
        set((state) => ({
          selectedTraits: {
            ...state.selectedTraits,
            [trait]: values,
          },
        })),

      clearTraitFilter: (trait: string) =>
        set((state) => {
          const newTraits = { ...state.selectedTraits }
          delete newTraits[trait]
          return { selectedTraits: newTraits }
        }),

      clearAllFilters: () =>
        set({
          searchQuery: "",
          searchNumber: "", // Clear searchNumber in clearAllFilters
          minOraNumber: "",
          maxOraNumber: "",
          favoritesOnly: false,
          showFavoritesOnly: false, // Clear showFavoritesOnly in clearAllFilters
          selectedTraits: {},
        }),

      toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

      setFilterPanelOpen: (open: boolean) => set({ isFilterPanelOpen: open }),

      getAvailableTraits: (oras: Ora[]) => {
        const traits: Record<string, Set<string>> = {}

        oras.forEach((ora) => {
          if (ora.traits) {
            Object.entries(ora.traits).forEach(([traitType, traitValue]) => {
              if (!traits[traitType]) {
                traits[traitType] = new Set()
              }
              if (traitValue && traitValue.trim() !== "") {
                traits[traitType].add(traitValue)
              }
            })
          }
        })

        // Convert Sets to sorted arrays
        const result: Record<string, string[]> = {}
        Object.entries(traits).forEach(([traitType, valueSet]) => {
          result[traitType] = Array.from(valueSet).sort()
        })

        return result
      },

      getFilteredOras: (oras: Ora[]) => {
        const state = get()
        let filtered = [...oras]

        // Filter by search query/number
        if (state.searchQuery || state.searchNumber) {
          const query = (state.searchQuery || state.searchNumber).toLowerCase()
          filtered = filtered.filter(
            (ora) =>
              ora.name.toLowerCase().includes(query) ||
              ora.oraNumber.toLowerCase().includes(query) ||
              ora.oraNumber === query,
          )
        }

        // Filter by ora number range
        if (state.minOraNumber || state.maxOraNumber) {
          filtered = filtered.filter((ora) => {
            const oraNum = Number.parseInt(ora.oraNumber)
            const min = state.minOraNumber ? Number.parseInt(state.minOraNumber) : 0
            const max = state.maxOraNumber ? Number.parseInt(state.maxOraNumber) : Number.POSITIVE_INFINITY
            return oraNum >= min && oraNum <= max
          })
        }

        // Filter by favorites
        if (state.favoritesOnly || state.showFavoritesOnly) {
          filtered = filtered.filter((ora) => state.favorites.has(ora.oraNumber))
        }

        // Filter by traits
        Object.entries(state.selectedTraits).forEach(([traitType, selectedValues]) => {
          if (selectedValues.length > 0) {
            filtered = filtered.filter((ora) => {
              const oraTraitValue = ora.traits[traitType]
              return oraTraitValue && selectedValues.includes(oraTraitValue)
            })
          }
        })

        return filtered
      },

      toggleFavorite: (oraId: string) =>
        set((state) => {
          const newFavorites = new Set(state.favorites)
          if (newFavorites.has(oraId)) {
            newFavorites.delete(oraId)
          } else {
            newFavorites.add(oraId)
          }
          return { favorites: newFavorites }
        }),

      isFavorite: (oraId: string) => get().favorites.has(oraId),
    }),
    {
      name: "ora-filter-storage",
      // Custom serialization for Set
      serialize: (state) =>
        JSON.stringify({
          ...state.state,
          favorites: Array.from(state.state.favorites),
        }),
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          ...parsed,
          favorites: new Set(parsed.favorites || []),
        }
      },
    },
  ),
)
