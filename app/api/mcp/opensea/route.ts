import { type NextRequest, NextResponse } from "next/server"

// MCP tool definitions for OpenSea and ENS
const MCP_TOOLS = {
  opensea_get_ora: {
    name: "opensea_get_ora",
    description: "Fetch Sugartown Ora NFT data from OpenSea",
    parameters: {
      type: "object",
      properties: {
        token_id: { type: "string", description: "NFT token ID" },
        include_traits: { type: "boolean", default: true },
      },
      required: ["token_id"],
    },
  },
  ens_lookup: {
    name: "ens_lookup",
    description: "Resolve ENS name to wallet address",
    parameters: {
      type: "object",
      properties: {
        ens_name: { type: "string", description: "ENS name to resolve" },
      },
      required: ["ens_name"],
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const { tool_name, parameters } = await request.json()

    if (!tool_name || !MCP_TOOLS[tool_name as keyof typeof MCP_TOOLS]) {
      return NextResponse.json({ error: "Invalid or missing tool_name" }, { status: 400 })
    }

    console.log(`[v0] MCP tool called: ${tool_name}`)

    switch (tool_name) {
      case "opensea_get_ora":
        return await handleOpenSeaGetOra(parameters)

      case "ens_lookup":
        return await handleENSLookup(parameters)

      default:
        return NextResponse.json({ error: "Tool not implemented" }, { status: 501 })
    }
  } catch (error) {
    console.error("MCP connector error:", error)
    return NextResponse.json({ error: "MCP tool execution failed" }, { status: 500 })
  }
}

async function handleOpenSeaGetOra(params: any) {
  const { token_id, include_traits = true } = params

  if (!process.env.OPENSEA_API_KEY) {
    return NextResponse.json({ error: "OpenSea API key not configured" }, { status: 503 })
  }

  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/contract/SUGARTOWN_CONTRACT_ADDRESS/nfts/${token_id}`,
      {
        headers: {
          "X-API-KEY": process.env.OPENSEA_API_KEY,
          accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        name: data.nft?.name,
        image: data.nft?.image_url,
        traits: include_traits ? data.nft?.traits : undefined,
        opensea_url: data.nft?.opensea_url,
      },
    })
  } catch (error) {
    console.error("OpenSea fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch NFT data" }, { status: 500 })
  }
}

async function handleENSLookup(params: any) {
  const { ens_name } = params

  try {
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${ens_name}`)

    if (!response.ok) {
      throw new Error(`ENS resolution failed: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: {
        ens_name,
        address: data.address,
        resolved: !!data.address,
      },
    })
  } catch (error) {
    console.error("ENS lookup error:", error)
    return NextResponse.json({ error: "ENS resolution failed" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    name: "OraKit MCP Server",
    version: "1.0.0",
    tools: Object.values(MCP_TOOLS),
    description: "MCP connector for OpenSea and ENS data",
  })
}
