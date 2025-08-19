"use client"
/**
 * App-wide providers
 *
 * Why this exists:
 * - Centralizes Wagmi + RainbowKit setup so every page gets the same config.
 * - Prevents duplicate providers in nested routes which can break wallet state.
 *
 * Notes for future devs:
 * - If you change supported chains or projectId, update the wagmi config
 *   and RainbowKitProvider here to keep the modal + hooks in sync.
 * - RainbowKit's modal uses a portal — make sure no ancestor has CSS transforms
 *   that would create a new stacking context (see /diagnostics).
 */

import type React from "react"

import { RainbowKitProvider, darkTheme, getDefaultConfig, connectorsForWallets } from "@rainbow-me/rainbowkit"
import { injectedWallet, coinbaseWallet, safeWallet } from "@rainbow-me/rainbowkit/wallets"
import { WagmiProvider, createConfig } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"
import { mainnet, base, polygon } from "wagmi/chains"

const queryClient = new QueryClient()

const chains = [mainnet, base, polygon] as const
const transports = {
  [mainnet.id]: http(),
  [base.id]: http(),
  [polygon.id]: http(),
} as const

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "9ddc083da41f3648b5c2abcae265e0ce"

const hasValidProjectId = projectId && projectId.trim().length > 0

if (typeof window !== "undefined") {
  console.info(`[RainbowKit] Project ID: "${projectId}"`)
  console.info(`[RainbowKit] Environment variable: "${process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}"`)
  console.info(`[RainbowKit] Has valid project ID: ${hasValidProjectId}`)
}

const config = hasValidProjectId
  ? getDefaultConfig({
      appName: "Sugar Depot",
      projectId: projectId!,
      chains,
      transports,
      ssr: true,
    })
  : createConfig({
      chains,
      transports,
      ssr: true,
      connectors: connectorsForWallets([
        {
          groupName: "Basic",
          wallets: [injectedWallet, coinbaseWallet({ appName: "Sugar Depot" }), safeWallet],
        },
      ]),
    })

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* modalSize keeps the connect UI compact; "coolMode" enables subtle motion.
    Tune these for OraKit's vibe to match the design system. */}
<RainbowKitProvider 
        theme={darkTheme({
        accentColor: '#7b3fe4',
        accentColorForeground: 'white',
      })} 
        modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
