import type { AIM } from "@/types/aim"
import { getDemoAim } from "./aim-seeds"

/**
 * Mock MCP (Model Context Protocol) service for demo purposes
 * In production, this would connect to the actual MCP server
 */
export class MockMCPService {
  /**
   * Retrieves an AIM profile from the MCP server
   * @param oraId - The Ora ID to fetch
   * @returns Promise<AIM | null>
   */
  static async getAIM(oraId: number): Promise<AIM | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200))

    const aim = getDemoAim(oraId)
    if (!aim) {
      throw new Error(`AIM profile not found for Ora #${oraId}`)
    }

    return aim
  }

  /**
   * Validates if an Ora ID has an available AIM profile
   * @param oraId - The Ora ID to check
   * @returns boolean
   */
  static hasAIM(oraId: number): boolean {
    return getDemoAim(oraId) !== null
  }

  /**
   * Gets metadata about available AIM profiles
   * @returns Array of available Ora IDs with basic info
   */
  static getAvailableProfiles(): Array<{ oraId: number; lastUpdated: string }> {
    return Object.entries(getDemoAim).map(([oraId, aim]) => ({
      oraId: Number(oraId),
      lastUpdated: aim?.meta.updatedAt || new Date().toISOString(),
    }))
  }
}

export default MockMCPService
