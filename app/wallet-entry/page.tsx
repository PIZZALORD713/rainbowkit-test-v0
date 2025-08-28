"use client"

import { useConnectModal } from "@rainbow-me/rainbowkit"

export default function WalletEntryPage() {
  const { openConnectModal } = useConnectModal()

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Connect Wallet</h1>
        <p className="opacity-80">Click below. You should see RainbowKit's centred, themed modal.</p>
        <button
          onClick={openConnectModal}
          className="rounded-md border border-purple-300 px-4 py-2 text-purple-600 hover:bg-purple-50"
        >
          Connect Wallet
        </button>
      </div>
    </main>
  )
}
