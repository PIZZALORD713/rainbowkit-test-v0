"use client"

import type React from "react"
import { useState } from "react"

import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http } from "viem"
import { mainnet, base, polygon } from "wagmi/chains"

const chains = [mainnet, base, polygon] as const
const transports = {
  [mainnet.id]: http(),
  [base.id]: http(),
  [polygon.id]: http(),
} as const

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "9ddc083da41f3648b5c2abcae265e0ce"

const config = getDefaultConfig({
  appName: "Sugar Depot",
  projectId: projectId,
  chains,
  transports,
  ssr: true,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
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
