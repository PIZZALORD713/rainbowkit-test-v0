"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { AIMFile } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"

interface ImportAIMModalProps {
  open: boolean
  onClose: () => void
  onImportSuccess: (aimFile: AIMFile) => void
}

export function ImportAIMModal({ open, onClose, onImportSuccess }: ImportAIMModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [parsedFile, setParsedFile] = useState<AIMFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".aim") && !file.name.endsWith(".json")) {
      setError("Please select a .aim or .json file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content) as AIMFile

        // Validate structure
        if (!parsed.oraNumber || !parsed.characterName) {
          setError("Invalid AIM file: missing required fields (oraNumber, characterName)")
          return
        }

        setParsedFile(parsed)
        setError(null)
      } catch (err) {
        setError("Invalid JSON format")
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!parsedFile) return

    const result = AIMStorage.importFile(parsedFile)

    if (result.success) {
      toast({
        title: "AIM Imported",
        description: "Your character was updated successfully.",
      })
      onImportSuccess(parsedFile)
      onClose()
    } else {
      toast({
        title: "Import Failed",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const resetModal = () => {
    setParsedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import AIM File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!parsedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Drop your AIM file here</h3>
              <p className="text-gray-600 mb-4">or click to browse for .aim or .json files</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <input ref={fileInputRef} type="file" accept=".aim,.json" onChange={handleFileInput} className="hidden" />
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error:</span>
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {parsedFile && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  AIM File Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Character Name:</span>
                    <p className="text-lg">{parsedFile.characterName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Ora Number:</span>
                    <p className="text-lg">#{parsedFile.oraNumber}</p>
                  </div>
                </div>

                {parsedFile.tags && parsedFile.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parsedFile.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                  <strong>Warning:</strong> This will overwrite any existing AIM data for Ora #{parsedFile.oraNumber}.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={resetModal} disabled={!parsedFile && !error}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!parsedFile}>
              <Upload className="w-4 h-4 mr-2" />
              Import AIM
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
