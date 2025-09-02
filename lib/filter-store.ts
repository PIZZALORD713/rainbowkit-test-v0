import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Ora {
  name: string
  oraNumber: string
  image: string
  traits: Record<string, string>
  openseaUrl: string
}

interface FilterState {
  // Search and basic filters
  searchNumber: string
  showFavoritesOnly: boolean

  // Trait filters
  selectedTraits: Record<string, string[]>

  // Favorites management
  favorites: Set<string>

  // Actions
  setSearchNumber: (search: string) => void
  setShowFavoritesOnly: (show: boolean) => void
  setTraitFilter: (traitType: string, values: string[]) => void
  clearTraitFilter: (traitType: string) => void
  clearAllFilters: () => void

  // Favorites actions
  toggleFavorite: (oraNumber: string) => void

  // Utility functions
  getAvailableTraits: (oras: Ora[]) => Record<string, string[]>
  getFilteredOras: (oras: Ora[]) => Ora[]
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchNumber: "",
      showFavoritesOnly: false,
      selectedTraits: {},
      favorites: new Set<string>(),

      // Actions
      setSearchNumber: (search: string) => set({ searchNumber: search }),

      setShowFavoritesOnly: (show: boolean) => set({ showFavoritesOnly: show }),

      setTraitFilter: (traitType: string, values: string[]) =>
        set((state) => ({
          selectedTraits: {
            ...state.selectedTraits,
            [traitType]: values,
          },
        })),

      clearTraitFilter: (traitType: string) =>
        set((state) => {
          const newTraits = { ...state.selectedTraits }
          delete newTraits[traitType]
          return { selectedTraits: newTraits }
        }),

      clearAllFilters: () =>
        set({
          searchNumber: "",
          showFavoritesOnly: false,
          selectedTraits: {},
        }),

      toggleFavorite: (oraNumber: string) =>
        set((state) => {
          const newFavorites = new Set(state.favorites)
          if (newFavorites.has(oraNumber)) {
            newFavorites.delete(oraNumber)
          } else {
            newFavorites.add(oraNumber)
          }
          return { favorites: newFavorites }
        }),

      // Utility functions
      getAvailableTraits: (oras: Ora[]) => {
        const traits: Record<string, Set<string>> = {}

        oras.forEach((ora) => {
          Object.entries(ora.traits).forEach(([key, value]) => {
            if (!traits[key]) {
              traits[key] = new Set()
            }
            traits[key].add(value)
          })
        })

        // Convert Sets to arrays
        const result: Record<string, string[]> = {}
        Object.entries(traits).forEach(([key, valueSet]) => {
          result[key] = Array.from(valueSet).sort()
        })

        return result
      },

      getFilteredOras: (oras: Ora[]) => {
        const state = get()
        let filtered = [...oras]

        // Apply search filter
        if (state.searchNumber) {
          const searchLower = state.searchNumber.toLowerCase()
          filtered = filtered.filter(
            (ora) => ora.name.toLowerCase().includes(searchLower) || ora.oraNumber.includes(state.searchNumber),
          )
        }

        // Apply favorites filter
        if (state.showFavoritesOnly) {
          filtered = filtered.filter((ora) => state.favorites.has(ora.oraNumber))
        }

        // Apply trait filters
        Object.entries(state.selectedTraits).forEach(([traitType, values]) => {
          if (values.length > 0) {
            filtered = filtered.filter((ora) => values.includes(ora.traits[traitType]))
          }
        })

        return filtered
      },
    }),
    {
      name: "sugartown-filter-storage",
      // Custom serialization for Set
      serialize: (state) =>
        JSON.stringify({
          ...state,
          favorites: Array.from(state.favorites),
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
