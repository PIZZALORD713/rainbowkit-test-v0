import type React from "react"
import type { Metadata } from "next"

import "./globals.css"
import WalletProvider from "@/context/wallet"

export const metadata: Metadata = {
  title: "OraKit",
  description: "Ora collector tools",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@rainbow-me/rainbowkit@2/dist/index.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              fetch('/api/ai-status')
                .then(res => res.json())
                .then(data => { window.__AI_AVAILABLE = data.aiAvailable })
                .catch(() => { window.__AI_AVAILABLE = false })
            `,
          }}
        />
      </head>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
