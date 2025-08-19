/**
 * Standalone providers (outside App Router).
 * Use this only if you need Wagmi/RainbowKit in an isolated tree
 * (storybook, embedded widgets). Avoid wrapping the app twice.
 */
"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit"
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains"

const config = getDefaultConfig({
  appName: "Sugartown Ora Dashboard",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
})

const queryClient = new QueryClient()

const customTheme = lightTheme({
  accentColor: "#7c3aed",
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Keep feature parity with /app/providers.tsx unless intentionally diverging. */}
<RainbowKitProvider theme={customTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
