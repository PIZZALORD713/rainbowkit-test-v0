import type { AIMFile } from "@/types/aim"

const AIM_STORAGE_KEY = "sugartown-aim-files"

export class AIMStorage {
  static getAll(): AIMFile[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(AIM_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading AIM files:", error)
      return []
    }
  }

  static getByOraNumber(oraNumber: string): AIMFile | null {
    const files = this.getAll()
    return files.find((file) => file.oraNumber === oraNumber) || null
  }

  static save(aimFile: AIMFile): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAll()
      const existingIndex = files.findIndex((file) => file.id === aimFile.id)

      aimFile.updatedAt = new Date().toISOString()
      const currentVersion = Number.parseInt(aimFile.version || "0", 10)
      aimFile.version = (currentVersion + 1).toString()

      if (existingIndex >= 0) {
        files[existingIndex] = aimFile
      } else {
        files.push(aimFile)
      }

      localStorage.setItem(AIM_STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error("Error saving AIM file:", error)
    }
  }

  static delete(id: string): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAll()
      const filtered = files.filter((file) => file.id !== id)
      localStorage.setItem(AIM_STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting AIM file:", error)
    }
  }

  static export(id: string): string {
    const file = this.getAll().find((f) => f.id === id)
    if (!file) throw new Error("AIM file not found")

    return JSON.stringify(file, null, 2)
  }

  static import(jsonString: string): AIMFile {
    try {
      const file = JSON.parse(jsonString) as AIMFile
      // Validate basic structure
      if (!file.id || !file.oraNumber || !file.characterName) {
        throw new Error("Invalid AIM file format")
      }
      return file
    } catch (error) {
      throw new Error("Failed to parse AIM file")
    }
  }

  static importFile(file: AIMFile): { success: boolean; message: string } {
    if (!file?.oraNumber || !file?.characterName) {
      return { success: false, message: "Invalid AIM file." }
    }

    try {
      // Update timestamps and ensure proper structure
      file.updatedAt = new Date().toISOString()
      if (!file.createdAt) {
        file.createdAt = new Date().toISOString()
      }

      this.save(file)
      return { success: true, message: "AIM imported successfully." }
    } catch {
      return { success: false, message: "Failed to import." }
    }
  }
}
