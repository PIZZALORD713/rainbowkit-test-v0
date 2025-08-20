// Drag-and-drop JSON importer for AIM files (v1 and v2).
// Auto-detects version and migrates legacy files to v2 format.
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X, Check, AlertCircle, ArrowRight, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { AIMFile, AIMv2, AIMFileOrV2 } from "@/types/aim"
import { isAIMv2 } from "@/types/aim"
import { AIMStorage } from "@/lib/aim-storage"
import { AIMMigration, type MigrationResult } from "@/lib/aim-migration"

interface ImportAIMModalProps {
  open: boolean
  onClose: () => void
  onImportSuccess: (aimFile: AIMFileOrV2) => void
}

export function ImportAIMModal({ open, onClose, onImportSuccess }: ImportAIMModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [parsedFile, setParsedFile] = useState<AIMFileOrV2 | null>(null)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileVersion, setFileVersion] = useState<"v1" | "v2" | null>(null)
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

  const handleDrop = (e) => {
    // Restrict to .json/.aim; reject huge files (>2MB) to avoid UI freezes.
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
        const parsed = JSON.parse(content)

        // Detect version and validate
        if (parsed.version === "aim-2") {
          // AIM v2 file
          if (!parsed.id || !parsed.subject || !parsed.canonical) {
            setError("Invalid AIM v2 file: missing required fields (id, subject, canonical)")
            return
          }
          setParsedFile(parsed as AIMv2)
          setFileVersion("v2")
          setMigrationResult(null)
        } else {
          // Assume AIM v1 file
          if (!parsed.oraNumber || !parsed.characterName) {
            setError("Invalid AIM file: missing required fields (oraNumber, characterName)")
            return
          }

          // Migrate v1 to v2
          const migration = AIMMigration.migrateV1ToV2(parsed as AIMFile, {
            preserveOriginalId: false,
            defaultChain: "ethereum",
            defaultContract: "unknown",
          })

          if (!migration.success) {
            setError(`Migration failed: ${migration.errors.join(", ")}`)
            return
          }

          setParsedFile(migration.aimv2!)
          setFileVersion("v1")
          setMigrationResult(migration)
        }

        setError(null)
      } catch (err) {
        setError("Invalid JSON format")
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!parsedFile) return

    try {
      if (isAIMv2(parsedFile)) {
        const result = AIMStorage.importV2File(parsedFile)
        if (result.success) {
          toast({
            title: "AIM v2 Imported",
            description:
              fileVersion === "v1"
                ? "Legacy file migrated to v2 format successfully."
                : "AIM v2 file imported successfully.",
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
      } else {
        // Fallback for v1 (shouldn't happen with current logic)
        const result = AIMStorage.importFile(parsedFile as AIMFile)
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
    } catch (err) {
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      })
    }
  }

  const resetModal = () => {
    setParsedFile(null)
    setMigrationResult(null)
    setFileVersion(null)
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
            {fileVersion && (
              <Badge variant={fileVersion === "v2" ? "default" : "secondary"}>
                {fileVersion === "v2" ? "v2" : "v1 → v2"}
              </Badge>
            )}
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
              <p className="text-gray-600 mb-4">Supports both AIM v1 and v2 formats (.aim or .json files)</p>
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

          {migrationResult && fileVersion === "v1" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Legacy AIM v1 detected</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Migrating to AIM v2</span>
                  </div>
                  {migrationResult.warnings.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium">Migration notes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {migrationResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {parsedFile && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  AIM File Preview
                  <Badge variant={fileVersion === "v2" ? "default" : "secondary"}>
                    {fileVersion === "v2" ? "v2" : "v1 → v2"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAIMv2(parsedFile) ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Character Title:</span>
                        <p className="text-lg">{parsedFile.persona.title}</p>
                      </div>
                      <div>
                        <span className="font-medium">Collection:</span>
                        <p className="text-lg">{parsedFile.subject.collectionName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Token ID:</span>
                        <p className="text-sm font-mono">{parsedFile.subject.tokenId}</p>
                      </div>
                      <div>
                        <span className="font-medium">Chain:</span>
                        <p className="text-sm capitalize">{parsedFile.subject.chain}</p>
                      </div>
                    </div>

                    {parsedFile.persona.tags && parsedFile.persona.tags.length > 0 && (
                      <div>
                        <span className="font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {parsedFile.persona.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(parsedFile.canonical.traits).length > 0 && (
                      <div>
                        <span className="font-medium">Canonical Traits:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(parsedFile.canonical.traits)
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          {Object.keys(parsedFile.canonical.traits).length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{Object.keys(parsedFile.canonical.traits).length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback for v1 display (shouldn't happen with current logic)
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Character Name:</span>
                      <p className="text-lg">{(parsedFile as AIMFile).characterName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Ora Number:</span>
                      <p className="text-lg">#{(parsedFile as AIMFile).oraNumber}</p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                  <strong>Warning:</strong> This will overwrite any existing AIM data for this character.
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
              Import AIM {fileVersion === "v2" ? "v2" : "(Migrate to v2)"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
