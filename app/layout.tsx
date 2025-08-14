import type React from "react"
import type { Metadata } from "next"

import "./rainbowkit.css"

import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "Sugar Depot",
  description: "Ora collector tools",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
