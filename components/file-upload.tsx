"use client"

import type React from "react"

import { Upload } from "lucide-react"
import { useCallback, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onFileLoad: (data: string, filename: string) => void
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Handle C source file
      if (file.name.endsWith('.c') || file.name.endsWith('.h')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          onFileLoad(text, file.name)
        }
        reader.onerror = () => {
          setError('Error reading file')
        }
        reader.readAsText(file)
      } else {
        setError('Please upload a .c or .h file containing animation data')
      }
    },
    [onFileLoad],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <input type="file" id="file-input" className="hidden" onChange={handleFileInput} accept=".c,.h" />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="w-12 h-24 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2 text-foreground">Drop a <code className="bg-muted px-1.5 py-0.5 rounded d-inline mx-1">.c</code> animation file</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </label>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
