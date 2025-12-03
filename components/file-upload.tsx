"use client"

import type React from "react"

import { Upload } from "lucide-react"
import { useCallback, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import JSZip from "jszip"

interface FileUploadProps {
  onFileLoad: (data: Uint8Array, filename: string) => void
}

export function FileUpload({ onFileLoad }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Check if it's a zip file
      if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.name.endsWith('.o2r')) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const zip = await JSZip.loadAsync(arrayBuffer)
          
          // Look for the message file in the zip
          const possiblePaths = [
            'override/text/nes_message_data_static/nes_message_data_static',
            'text/nes_message_data_static/nes_message_data_static',
          ]
          
          let messageFile = null
          let foundPath = ''
          
          for (const path of possiblePaths) {
            const file = zip.file(path)
            if (file) {
              messageFile = file
              foundPath = path
              break
            }
          }
          
          if (!messageFile) {
            // List available files to help user
            const files = Object.keys(zip.files).filter(name => !name.endsWith('/'))
            setError('Could not find message file in zip')
            return
          }
          
          const data = await messageFile.async('uint8array')
          onFileLoad(data, 'nes_message_data_static')
        } catch (err) {
          setError(`Error reading zip file: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      } else {
        // Handle regular binary file
        const reader = new FileReader()
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const uint8Array = new Uint8Array(arrayBuffer)
          onFileLoad(uint8Array, file.name)
        }
        reader.onerror = () => {
          setError('Error reading file')
        }
        reader.readAsArrayBuffer(file)
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
        <input type="file" id="file-input" className="hidden" onChange={handleFileInput} accept=".zip,.o2r,*" />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="w-12 h-24 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2 text-foreground">Drop a <code className="bg-muted px-1.5 py-0.5 rounded d-inline mx-1">.o2r</code> file</p>
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
