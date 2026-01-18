"use client"

import type React from "react"
import { postJSON } from "@/lib/api-client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Loader2, AlertCircle, Clock, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AIMDelta } from "@/types/aim"

interface AIMAutofillProps {
  oraNumber: string
  traits: Record<string, string>
  imageUrl: string
  onApply: (delta: AIMDelta, accepted: Record<string, boolean>) => void
  disabled?: boolean
}

interface DemoAIMResponse extends AIMDelta {
  _demo?: boolean
  _message?: string
  retryAfter?: number
}

export function AIMAutofill({ oraNumber, traits, imageUrl, onApply, disabled }: AIMAutofillProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [delta, setDelta] = useState<AIMDelta | null>(null)
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [retryCountdown, setRetryCountdown] = useState<number>(0)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string>("")
  const { toast } = useToast()

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("[v0] AIMAutofill button clicked for Ora", oraNumber, "disabled:", disabled)
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(true)
      console.log("[v0] Opening AIMAutofill dialog")
    } else {
      console.log("[v0] AIMAutofill button is disabled")
    }
  }

  const startRetryCountdown = (seconds: number) => {
    setRetryCountdown(seconds)
    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setRetryAfter(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const aimDelta: DemoAIMResponse = await postJSON("/api/aim/analyze", {
        oraNumber: Number.parseInt(oraNumber),
        traits,
        imageUrl,
      })

      if (aimDelta._demo) {
        setIsDemoMode(true)
        setDemoMessage(aimDelta._message || "Demo mode active")

        if (aimDelta._message?.includes("Rate limited")) {
          toast({
            title: "Using Demo Analysis",
            description: "OpenAI rate limited - showing simulated analysis instead",
            variant: "default",
          })
        } else {
          toast({
            title: "Demo Mode",
            description: "AI analysis simulated for demonstration",
            variant: "default",
          })
        }
      } else {
        setIsDemoMode(false)
        setDemoMessage("")

        toast({
          title: "Analysis Complete",
          description: "AI has analyzed your Ora's traits and generated suggestions",
          variant: "default",
        })
      }

      setDelta(aimDelta)

      const initialAccepted: Record<string, boolean> = {}
      Object.entries(aimDelta.confidence).forEach(([key, confidence]) => {
        initialAccepted[key] = confidence > 0.7
      })
      setAccepted(initialAccepted)
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze Ora traits",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (delta) {
      onApply(delta, accepted)
      setIsOpen(false)
      setDelta(null)
      setAccepted({})
      setIsDemoMode(false)
      setDemoMessage("")

      const acceptedCount = Object.values(accepted).filter(Boolean).length
      toast({
        title: "AIM Updated",
        description: isDemoMode
          ? `${acceptedCount} demo suggestions applied to your AIM file`
          : `${acceptedCount} AI suggestions applied to your AIM file`,
      })
    }
  }

  const renderField = (path: string, value: any, confidence: number) => {
    const [category, field] = path.split(".")
    const isAccepted = accepted[path]

    return (
      <div key={path} className="flex items-start space-x-3 p-3 rounded-lg border bg-white/50">
        <Checkbox
          checked={isAccepted}
          onCheckedChange={(checked) => setAccepted((prev) => ({ ...prev, [path]: checked as boolean }))}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-700 capitalize">
              {category}.{field}
            </span>
            <Badge
              variant={confidence > 0.7 ? "default" : confidence > 0.5 ? "secondary" : "outline"}
              className={`text-xs ${
                confidence > 0.7
                  ? "bg-green-100 text-green-800"
                  : confidence > 0.5
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {Math.round(confidence * 100)}% confident
            </Badge>
          </div>
          <div className="text-sm text-slate-600">{Array.isArray(value) ? value.join(", ") : String(value)}</div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleButtonClick}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 relative z-20"
        >
          <Sparkles className="w-4 h-4" />
          AI Autofill AIM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby="aim-autofill-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Analysis for Ora #{oraNumber}
            {isDemoMode && (
              <Badge variant="secondary" className="ml-2">
                <TestTube className="w-3 h-3 mr-1" />
                Demo
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription id="aim-autofill-desc" className="sr-only">
            Review suggested AIM fields from AI analysis and accept or reject each before saving.
          </DialogDescription>
        </DialogHeader>

        {!delta ? (
          <div className="text-center py-8">
            {retryAfter ? (
              <div className="mb-6">
                <Clock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Rate Limited</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-4">
                  Too many requests have been made. Please wait before trying again.
                </p>
                <div className="text-2xl font-mono text-orange-600">
                  {retryCountdown > 0 ? `${retryCountdown}s` : "Ready!"}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyze Your Ora</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Our AI will analyze your Ora's traits and suggest personality, abilities, and visual elements for your
                  AIM.
                </p>
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={loading || retryAfter !== null}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : retryAfter ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Wait {retryCountdown}s
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isDemoMode && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <TestTube className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Demo Mode Active</p>
                  <p className="text-xs text-amber-700">{demoMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Review the AI suggestions below. Uncheck any fields you don't want to apply.
              </p>
            </div>

            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {Object.entries(delta.confidence).map(([path, confidence]) => {
                  const [category, field] = path.split(".")
                  const value = (delta.patch as any)[category]?.[field]
                  return renderField(path, value, confidence)
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                Apply Selected Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
