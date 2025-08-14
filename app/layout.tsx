import type React from "react"
import type { Metadata } from "next"

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
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@rainbow-me/rainbowkit@2.2.8/dist/index.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
