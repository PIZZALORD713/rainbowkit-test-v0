export interface MCPTool {
  name: string
  description: string
  parameters: any
}

export interface MCPServerConfig {
  server_label: string
  server_url: string
  allowed_tools: string[]
  require_approval: "always" | "never" | "user_choice"
}

export class MCPClient {
  private serverConfig: MCPServerConfig

  constructor(config: MCPServerConfig) {
    this.serverConfig = config
  }

  async callTool(toolName: string, parameters: any) {
    try {
      const response = await fetch(`${this.serverConfig.server_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool_name: toolName,
          parameters,
        }),
      })

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`MCP tool ${toolName} failed:`, error)
      throw error
    }
  }

  async enhancePromptWithTools(messages: any[], availableTools: string[] = []) {
    if (!process.env.OPENAI_API_KEY || !this.serverConfig.server_url) {
      return messages
    }

    // Add MCP tool configuration to the conversation
    const mcpConfig = {
      type: "mcp",
      server_label: this.serverConfig.server_label,
      server_url: this.serverConfig.server_url,
      allowed_tools: availableTools.length > 0 ? availableTools : this.serverConfig.allowed_tools,
      require_approval: this.serverConfig.require_approval,
    }

    return [
      ...messages,
      {
        role: "system",
        content: `MCP Tools Available: ${JSON.stringify(mcpConfig)}`,
      },
    ]
  }
}

// Default MCP client for OraKit
export const orakitMCPClient = new MCPClient({
  server_label: "orakit-data",
  server_url: process.env.ORAKIT_MCP_SERVER_URL || "/api/mcp/opensea",
  allowed_tools: ["opensea_get_ora", "ens_lookup"],
  require_approval: "never",
})
