import type { CMPFile } from "@/types/cmp"

const CMP_STORAGE_KEY = "sugartown-cmp-files"

export class CMPStorage {
  static getAll(): CMPFile[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(CMP_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading CMP files:", error)
      return []
    }
  }

  static getByOraNumber(oraNumber: string): CMPFile | null {
    const files = this.getAll()
    return files.find((file) => file.oraNumber === oraNumber) || null
  }

  static save(cmpFile: CMPFile): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAll()
      const existingIndex = files.findIndex((file) => file.id === cmpFile.id)

      cmpFile.updatedAt = new Date().toISOString()
      cmpFile.version += 1

      if (existingIndex >= 0) {
        files[existingIndex] = cmpFile
      } else {
        files.push(cmpFile)
      }

      localStorage.setItem(CMP_STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error("Error saving CMP file:", error)
    }
  }

  static delete(id: string): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAll()
      const filtered = files.filter((file) => file.id !== id)
      localStorage.setItem(CMP_STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting CMP file:", error)
    }
  }

  static export(id: string): string {
    const file = this.getAll().find((f) => f.id === id)
    if (!file) throw new Error("CMP file not found")

    return JSON.stringify(file, null, 2)
  }

  static import(jsonString: string): CMPFile {
    try {
      const file = JSON.parse(jsonString) as CMPFile
      // Validate basic structure
      if (!file.id || !file.oraNumber || !file.characterName) {
        throw new Error("Invalid CMP file format")
      }
      return file
    } catch (error) {
      throw new Error("Failed to parse CMP file")
    }
  }
}
