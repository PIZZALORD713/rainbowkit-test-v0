import { NextResponse } from "next/server"

export async function GET() {
  const apiDocs = {
    title: "Sugartown Ora API for ChatGPT",
    version: "1.0.0",
    description: "API to fetch Sugartown Ora NFTs from ENS names or EVM addresses",
    baseUrl: "https://your-domain.com/api/chatgpt",
    endpoints: {
      "/oras": {
        method: "GET",
        description: "Fetch Sugartown Oras for a given ENS name or EVM address",
        parameters: {
          address: {
            type: "string",
            required: true,
            description: "ENS name (e.g., vitalik.eth) or EVM address (0x...)",
            examples: ["vitalik.eth", "0x1234567890123456789012345678901234567890"],
          },
          format: {
            type: "string",
            required: false,
            default: "detailed",
            options: ["detailed", "summary"],
            description: "Response format - 'summary' limits to 10 Oras, 'detailed' returns all",
          },
          includeTraits: {
            type: "boolean",
            required: false,
            default: true,
            description: "Whether to include NFT traits/attributes in the response",
          },
        },
        response: {
          success: "boolean",
          data: {
            wallet: "string - The resolved EVM address",
            ensName: "string - The original ENS name if provided",
            totalOras: "number - Total number of Oras found",
            oras: [
              {
                name: "string - NFT name",
                tokenId: "string - Token ID",
                image: "string - Image URL",
                traits: "object - NFT attributes/traits",
                openseaUrl: "string - OpenSea URL",
              },
            ],
            collectionInfo: {
              name: "string - Collection name",
              contractAddress: "string - Smart contract address",
              blockchain: "string - Blockchain network",
            },
          },
          message: "string - Human readable message",
          error: "string - Error message if success is false",
        },
        examples: {
          "Fetch all Oras for ENS name": {
            url: "/api/chatgpt/oras?address=vitalik.eth",
            description: "Get all Sugartown Oras owned by vitalik.eth",
          },
          "Fetch summary for wallet address": {
            url: "/api/chatgpt/oras?address=0x1234567890123456789012345678901234567890&format=summary",
            description: "Get up to 10 Oras for the given wallet address",
          },
          "Fetch without traits": {
            url: "/api/chatgpt/oras?address=example.eth&includeTraits=false",
            description: "Get Oras without including trait information",
          },
        },
      },
    },
    usage: {
      "For Custom GPT": {
        description: "Use this API in your Custom GPT actions configuration",
        actionSchema: {
          openapi: "3.1.0",
          info: {
            title: "Sugartown Ora API",
            version: "1.0.0",
          },
          servers: [
            {
              url: "https://your-domain.com/api/chatgpt",
            },
          ],
          paths: {
            "/oras": {
              get: {
                operationId: "getSugartownOras",
                summary: "Get Sugartown Oras for ENS name or wallet address",
                parameters: [
                  {
                    name: "address",
                    in: "query",
                    required: true,
                    schema: { type: "string" },
                    description: "ENS name or EVM address",
                  },
                  {
                    name: "format",
                    in: "query",
                    required: false,
                    schema: { type: "string", enum: ["detailed", "summary"] },
                    description: "Response format",
                  },
                ],
              },
            },
          },
        },
      },
    },
    rateLimit: "No rate limiting currently implemented",
    cors: "Enabled for all origins",
    authentication: "None required",
  }

  return NextResponse.json(apiDocs, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
