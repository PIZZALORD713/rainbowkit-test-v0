"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Sparkles, ArrowRight } from "lucide-react"

export function UpsellBanner() {
  const handleUpsellClick = () => {
    // Dispatch telemetry event
    window.dispatchEvent(
      new CustomEvent("demo_metric", {
        detail: { event: "upsell_click", source: "template_generation" },
      }),
    )
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-bold">Ready to try with your own Oras?</h3>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Connect your wallet to generate AI artwork for your entire Sugartown Ora collection. Create unlimited
              prompts, save your favorites, and export high-resolution images.
            </p>
          </div>
          <div className="ml-6">
            <Button
              onClick={handleUpsellClick}
              className="bg-white text-indigo-600 hover:bg-white/90 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
