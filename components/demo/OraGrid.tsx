"use client"
import { OraCard } from "./OraCard"

interface OraGridProps {
  oraIds: number[]
}

export function OraGrid({ oraIds }: OraGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {oraIds.map((oraId) => (
        <OraCard key={oraId} oraId={oraId} />
      ))}
    </div>
  )
}
