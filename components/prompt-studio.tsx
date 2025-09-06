"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Palette, Loader2, Download, ImageIcon, Wand2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AIM, PromptBundle } from "@/types/aim"

interface PromptStudioProps {
  aim: AIM
  disabled?: boolean
}

export function PromptStudio({ aim, disabled }: PromptStudioProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompts, setPrompts] = useState<PromptBundle | null>(null)
  const [editedPrompts, setEditedPrompts] = useState<PromptBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [rendering, setRendering] = useState<Record<string, boolean>>({})
  const [images, setImages] = useState<Record<string, Array<{ url: string; revised_prompt?: string }>>>({})
  const { toast } = useToast()

  const handleGeneratePrompts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/aim/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aim }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Prompt generation failed")
      }

      const { prompts: generatedPrompts } = await response.json()
      setPrompts(generatedPrompts)
      setEditedPrompts(generatedPrompts)
    } catch (error) {
      console.error("Prompt generation error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRenderImage = async (mode: string, prompt: string) => {
    setRendering((prev) => ({ ...prev, [mode]: true }))
    try {
      const response = await fetch("/api/dalle/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Image generation failed")
      }

      const { images: generatedImages } = await response.json()
      setImages((prev) => ({ ...prev, [mode]: generatedImages }))

      toast({
        title: "Image Generated",
        description: `${mode} image has been created successfully`,
      })
    } catch (error) {
      console.error("Image generation error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      })
    } finally {
      setRendering((prev) => ({ ...prev, [mode]: false }))
    }
  }

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPromptTab = (mode: string, prompts: string[]) => (
    <div className="space-y-4">
      {prompts.map((prompt, index) => (
        <div key={index} className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Prompt {index + 1}
            </Badge>
            <Button
              size="sm"
              onClick={() => handleRenderImage(mode, editedPrompts?.[mode as keyof PromptBundle]?.[index] || prompt)}
              disabled={rendering[mode]}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {rendering[mode] ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 mr-1" />
                  Render with DALL·E
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={editedPrompts?.[mode as keyof PromptBundle]?.[index] || prompt}
            onChange={(e) => {
              if (editedPrompts) {
                const updated = { ...editedPrompts }
                if (!updated[mode as keyof PromptBundle]) {
                  updated[mode as keyof PromptBundle] = []
                }
                updated[mode as keyof PromptBundle]![index] = e.target.value
                setEditedPrompts(updated)
              }
            }}
            className="min-h-20 text-sm"
            placeholder="Edit your prompt here..."
          />
        </div>
      ))}

      {/* Generated Images */}
      {images[mode] && images[mode].length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Generated Images
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {images[mode].map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={`Generated ${mode} ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownloadImage(image.url, `ora-${aim.meta.oraNumber}-${mode}-${index + 1}.png`)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800"
        >
          <Palette className="w-4 h-4" />
          Prompt Studio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            Prompt Studio - Ora #{aim.meta.oraNumber}
          </DialogTitle>
        </DialogHeader>

        {!prompts ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Palette className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate AI Prompts</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Create DALL·E prompts for portraits, action scenes, stickers, and wallpapers based on your AIM data.
              </p>
            </div>
            <Button
              onClick={handleGeneratePrompts}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Prompts
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="portrait" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="portrait">Portrait</TabsTrigger>
              <TabsTrigger value="action">Action</TabsTrigger>
              <TabsTrigger value="sticker">Sticker</TabsTrigger>
              <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[60vh] mt-4">
              <TabsContent value="portrait" className="mt-0">
                {renderPromptTab("portrait", prompts.portrait)}
              </TabsContent>
              <TabsContent value="action" className="mt-0">
                {renderPromptTab("action", prompts.action)}
              </TabsContent>
              <TabsContent value="sticker" className="mt-0">
                {renderPromptTab("sticker", prompts.sticker)}
              </TabsContent>
              <TabsContent value="wallpaper" className="mt-0">
                {renderPromptTab("wallpaper", prompts.wallpaper)}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
