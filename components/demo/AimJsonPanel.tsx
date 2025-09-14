"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { AIM } from "@/types/aim"

interface AimJsonPanelProps {
  aim: AIM
}

interface JsonNodeProps {
  data: any
  keyName?: string
  level?: number
  isLast?: boolean
}

function JsonNode({ data, keyName, level = 0, isLast = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels

  const indent = level * 20
  const isObject = typeof data === "object" && data !== null && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const isExpandable = isObject || isArray
  const isEmpty = isExpandable && Object.keys(data).length === 0

  const getValueColor = (value: any) => {
    if (typeof value === "string") return "text-green-600"
    if (typeof value === "number") return "text-blue-600"
    if (typeof value === "boolean") return "text-purple-600"
    if (value === null) return "text-gray-500"
    return "text-slate-700"
  }

  const formatValue = (value: any) => {
    if (typeof value === "string") return `"${value}"`
    if (value === null) return "null"
    return String(value)
  }

  if (!isExpandable) {
    return (
      <div className="font-mono text-sm" style={{ paddingLeft: indent }}>
        {keyName && <span className="text-slate-600">"{keyName}":</span>}
        <span className={getValueColor(data)}>{formatValue(data)}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    )
  }

  const entries = Object.entries(data)

  return (
    <div>
      <div className="font-mono text-sm" style={{ paddingLeft: indent }}>
        <div className="flex items-center">
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4 mr-1 hover:bg-slate-100"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Button>
          )}
          {isEmpty && <div className="w-5" />}
          {keyName && <span className="text-slate-600">"{keyName}":</span>}
          <span className="text-slate-400">
            {isArray ? "[" : "{"}
            {isEmpty && (isArray ? "]" : "}")}
            {!isEmpty && !isExpanded && (
              <span className="text-slate-500 ml-1">
                {entries.length} item{entries.length !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        </div>
      </div>

      {!isEmpty && isExpanded && (
        <div>
          {entries.map(([key, value], index) => (
            <JsonNode
              key={key}
              data={value}
              keyName={isArray ? undefined : key}
              level={level + 1}
              isLast={index === entries.length - 1}
            />
          ))}
          <div className="font-mono text-sm text-slate-400" style={{ paddingLeft: indent }}>
            {isArray ? "]" : "}"}
            {!isLast && <span>,</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export function AimJsonPanel({ aim }: AimJsonPanelProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-200">
      <JsonNode data={aim} />
    </div>
  )
}
