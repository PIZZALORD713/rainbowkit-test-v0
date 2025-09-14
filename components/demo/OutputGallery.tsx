"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Sparkles } from "lucide-react"

interface OutputGalleryProps {
  images: string[]
  loading: boolean
  error: string | null
  mode: string
}

export function OutputGallery({ images, loading, error, mode }: OutputGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100" />
            <CardContent className="p-3">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium mb-1">Generation Failed</p>
          <p className="text-red-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600">Click "Generate" to create {mode} images</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((imageUrl, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={`Generated ${mode} ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-2 right-2 bg-white/90 text-purple-700 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by MCP
            </Badge>
          </div>
          <CardContent className="p-3">
            <p className="text-sm font-medium text-slate-900">
              Generated {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </p>
            <p className="text-xs text-slate-600">AI-powered by AIM profile</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
