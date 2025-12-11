"use client"

import { useState, useCallback } from "react"
import { parseO2RArchive, type ResourceEntry } from "@/lib/o2r-parser"
import { ResourceTree } from "@/components/resource-tree"
import { HexViewer } from "@/components/hex-viewer"
import { FileCode2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [resources, setResources] = useState<ResourceEntry[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setResources([])
    setSelectedPath(null)

    try {
      const parsedResources = await parseO2RArchive(file)
      setResources(parsedResources)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse O2R file")
      console.error("Error parsing O2R:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleResourceSelect = useCallback((path: string) => {
    setSelectedPath(path)
  }, [])

  const selectedResource = resources.find(r => r.path === selectedPath)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileCode2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">O2R Resource Editor</h1>
              <p className="text-sm text-muted-foreground">
                Browse and inspect Ship of Harkinian resource files
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex">
        {resources.length === 0 ? (
          <div className="container mx-auto px-6 py-8 h-full flex items-center justify-center">
            <Card className="w-full max-w-2xl">
              <CardContent className="pt-6">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">Drop an O2R file to get started</h2>
                  <p className="text-muted-foreground mb-4">
                    or click to browse your files
                  </p>
                  {isLoading && (
                    <p className="text-sm text-primary">Loading...</p>
                  )}
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept=".o2r,.otr"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Sidebar with resource tree */}
            <div className="w-80 border-r border-border bg-card flex flex-col">
              <div className="border-b border-border p-4 flex items-center justify-between">
                <h2 className="font-semibold">Resources</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setResources([])
                    setSelectedPath(null)
                  }}
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ResourceTree
                  resources={resources}
                  selectedPath={selectedPath}
                  onResourceSelect={handleResourceSelect}
                />
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-hidden">
              {selectedResource ? (
                <div className="h-full p-6 overflow-auto">
                  <HexViewer resource={selectedResource} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileCode2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a resource from the tree to view its contents</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
