"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import CustomConnectButton from "@/components/custom-connect-button"

// Inner component that uses Wagmi hooks - only rendered after hydration
function LandingContent() {
  const router = useRouter()
  const { isConnected } = useAccount()

  // Redirect to dashboard when wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard")
    }
  }, [isConnected, router])

  return (
    <main className="min-h-dvh grid place-items-center p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">OraKit</h1>
            <p className="text-lg text-slate-400 mt-1">Avatar Identity Model</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-slate-300 text-lg leading-relaxed">
            Connect your wallet to explore your Sugartown Ora collection and create rich Avatar Identity Models.
          </p>
          <p className="text-slate-400 text-sm">
            Transform your NFTs into interactive characters with detailed personality profiles, backstories, and
            behavioral traits.
          </p>
        </div>

        {/* Connect Button */}
        <div className="pt-4">
          <CustomConnectButton />
        </div>

        {/* Footer hint */}
        <p className="text-slate-500 text-xs pt-8">
          Powered by RainbowKit and WalletConnect
        </p>
      </div>
    </main>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <main className="min-h-dvh grid place-items-center p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    )
  }

  return <LandingContent />
}
