"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function WalletEntryPage() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Connect Wallet</h1>
        <p className="opacity-80">Click the button below. You should see RainbowKit's centered, themed modal.</p>
        <div className="grid place-items-center">
          <ConnectButton label="Connect Wallet" />
        </div>
      </div>
    </main>
  )
}
