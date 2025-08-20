import type { AIMFile, AIMv2, AIMFileOrV2 } from "@/types/aim"

const AIM_STORAGE_KEY = "sugartown-aim-files"
const AIM_V2_STORAGE_KEY = "sugartown-aim-v2-files"

export class AIMStorage {
  /** Load all AIM files from localStorage. Returns [] if nothing stored. */
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

  static getAllV2(): AIMv2[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(AIM_V2_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading AIM v2 files:", error)
      return []
    }
  }

  static getAllFiles(): AIMFileOrV2[] {
    return [...this.getAll(), ...this.getAllV2()]
  }

  static getByOraNumber(oraNumber: string): AIMFile | null {
    const files = this.getAll()
    return files.find((file) => file.oraNumber === oraNumber) || null
  }

  static getV2BySubject(chain: string, contract: string, tokenId: string): AIMv2 | null {
    const files = this.getAllV2()
    return (
      files.find(
        (file) =>
          file.subject.chain === chain && file.subject.contract === contract && file.subject.tokenId === tokenId,
      ) || null
    )
  }

  static getV2ById(id: string): AIMv2 | null {
    const files = this.getAllV2()
    return files.find((file) => file.id === id) || null
  }

  // If schemas evolve, consider a lightweight migration step here.
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

  static saveV2(aimFile: AIMv2): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAllV2()
      const existingIndex = files.findIndex((file) => file.id === aimFile.id)

      // Attach version and updatedAt on save
      aimFile.updatedAt = new Date().toISOString()
      aimFile.version = "aim-2"

      if (existingIndex >= 0) {
        files[existingIndex] = aimFile
      } else {
        files.push(aimFile)
      }

      localStorage.setItem(AIM_V2_STORAGE_KEY, JSON.stringify(files))
    } catch (error) {
      console.error("Error saving AIM v2 file:", error)
    }
  }

  static saveFile(file: AIMFileOrV2): void {
    if (isAIMv2(file)) {
      this.saveV2(file)
    } else {
      this.save(file as AIMFile)
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

  static deleteV2(id: string): void {
    if (typeof window === "undefined") return

    try {
      const files = this.getAllV2()
      const filtered = files.filter((file) => file.id !== id)
      localStorage.setItem(AIM_V2_STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting AIM v2 file:", error)
    }
  }

  static deleteFile(id: string): void {
    // Try to delete from both storage locations
    this.delete(id)
    this.deleteV2(id)
  }

  static export(id: string): string {
    const file = this.getAll().find((f) => f.id === id)
    if (!file) throw new Error("AIM file not found")

    return JSON.stringify(file, null, 2)
  }

  static exportV2(id: string): string {
    const file = this.getAllV2().find((f) => f.id === id)
    if (!file) throw new Error("AIM v2 file not found")

    return JSON.stringify(file, null, 2)
  }

  static exportFile(id: string): string {
    // Try v2 first, then v1
    try {
      return this.exportV2(id)
    } catch {
      return this.export(id)
    }
  }

  // Shared import path. Overwrites only if IDs match; warn users before replacing.
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

  static importV2(jsonString: string): AIMv2 {
    try {
      const file = JSON.parse(jsonString) as AIMv2
      // Validate basic v2 structure
      if (!file.id || file.version !== "aim-2" || !file.subject || !file.canonical) {
        throw new Error("Invalid AIM v2 file format")
      }
      return file
    } catch (error) {
      throw new Error("Failed to parse AIM v2 file")
    }
  }

  static importFile(jsonString: string): AIMFileOrV2 {
    try {
      const parsed = JSON.parse(jsonString)

      // Check if it's AIM v2
      if (parsed.version === "aim-2") {
        return this.importV2(jsonString)
      } else {
        return this.import(jsonString)
      }
    } catch (error) {
      throw new Error("Failed to parse AIM file")
    }
  }

  static importV2File(file: AIMv2): { success: boolean; message: string } {
    if (!file?.id || file.version !== "aim-2" || !file.subject) {
      return { success: false, message: "Invalid AIM v2 file." }
    }

    try {
      // Update timestamps and ensure proper structure
      file.updatedAt = new Date().toISOString()
      if (!file.createdAt) {
        file.createdAt = new Date().toISOString()
      }

      this.saveV2(file)
      return { success: true, message: "AIM v2 imported successfully." }
    } catch {
      return { success: false, message: "Failed to import AIM v2." }
    }
  }

  static importAnyFile(file: AIMFileOrV2): { success: boolean; message: string } {
    if (isAIMv2(file)) {
      return this.importV2File(file)
    } else {
      return this.importFile(file as AIMFile)
    }
  }
}
