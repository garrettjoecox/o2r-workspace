"use client"

import type React from "react"

import { Upload } from "lucide-react"
import { useCallback, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onFileLoad: (data: string, filename: string) => void
  onPartialFileLoad?: (data: string, filename: string, type: 'data' | 'header') => void
  uploadedFiles?: { data?: string; header?: string }
}

export function FileUpload({ onFileLoad, onPartialFileLoad, uploadedFiles }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Handle C source file
      if (file.name.endsWith('.c') || file.name.endsWith('.h')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          
          // Check if it's a complete file or partial file
          const hasLinkData = /s16\s+\w+\s*\[\s*\]\s*=\s*\{/.test(text)
          const hasLinkHeader = /LinkAnimationHeader\s+\w+\s*=\s*\{/.test(text)
          const hasActorFrameData = /s16\s+\w+\s*\[\s*\]\s*=\s*\{/.test(text)
          const hasActorJointIndices = /JointIndex\s+\w+\s*\[\s*\]\s*=\s*\{/.test(text)
          const hasActorHeader = /AnimationHeader\s+\w+\s*=\s*\{/.test(text) && !/LinkAnimationHeader/.test(text)
          
          if ((hasLinkData && hasLinkHeader) || (hasActorFrameData && hasActorJointIndices && hasActorHeader)) {
            // Complete file - use the original callback
            onFileLoad(text, file.name)
          } else if (hasLinkData && !hasLinkHeader) {
            // Link data file only
            if (onPartialFileLoad) {
              onPartialFileLoad(text, file.name, 'data')
            }
          } else if (!hasLinkData && hasLinkHeader) {
            // Link header file only
            if (onPartialFileLoad) {
              onPartialFileLoad(text, file.name, 'header')
            }
          } else {
            setError('File does not contain valid animation data or header')
          }
        }
        reader.onerror = () => {
          setError('Error reading file')
        }
        reader.readAsText(file)
      } else {
        setError('Please upload a .c or .h file containing animation data')
      }
    },
    [onFileLoad, onPartialFileLoad],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        // Process first file, or could be enhanced to handle multiple
        handleFile(files[0])
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

  const needsDataFile = uploadedFiles?.header && !uploadedFiles?.data
  const needsHeaderFile = uploadedFiles?.data && !uploadedFiles?.header

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
          {needsDataFile ? (
            <>
              <p className="text-lg mb-2 text-foreground">Drop the <strong>data file</strong> (.c with s16 array)</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </>
          ) : needsHeaderFile ? (
            <>
              <p className="text-lg mb-2 text-foreground">Drop the <strong>header file</strong> (.c with animation header)</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2 text-foreground">Drop a <code className="bg-muted px-1.5 py-0.5 rounded d-inline mx-1">.c</code> animation file</p>
              <p className="text-sm text-muted-foreground">Supports Link and Actor animations | or click to browse</p>
            </>
          )}
        </label>
      </div>
      {uploadedFiles?.data && (
        <Alert>
          <AlertDescription className="text-sm">✓ Data file uploaded</AlertDescription>
        </Alert>
      )}
      {uploadedFiles?.header && (
        <Alert>
          <AlertDescription className="text-sm">✓ Header file uploaded</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
