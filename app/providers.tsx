"use client"

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

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

// If projectId exists → full WalletConnect setup.
// If missing → fall back to wallets that don't need WC, so the app keeps working.
const config = projectId
  ? getDefaultConfig({
      appName: "Sugar Depot",
      projectId,
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

if (typeof window !== "undefined") {
  console.info(`[ENV] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is ${projectId ? "present" : "MISSING"} in this build.`)
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
