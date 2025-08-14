"use client"

import { useConnectModal } from "@rainbow-me/rainbowkit"

export default function CustomConnectButton() {
  const { openConnectModal } = useConnectModal()
  return (
    <button
      onClick={openConnectModal}
      className="rounded-xl px-4 py-2 font-medium border border-white/20 hover:bg-white/5 transition"
    >
      Connect
    </button>
  )
}
