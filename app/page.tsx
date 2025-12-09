"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { AnimationList } from "@/components/animation-list"
import { AnimationEditor } from "@/components/animation-editor"
import { parseAnimationFromC, type AnimationEntry, animationDataToBlob, animationHeaderToBlob, animationToC } from "@/lib/animation-parser"
import { FileCode2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import JSZip from "jszip"

export default function Home() {
  const [step, setStep] = useState<"select" | "upload" | "edit">("select")
  const [selectedAnimationName, setSelectedAnimationName] = useState<string>("")
  const [animation, setAnimation] = useState<AnimationEntry | null>(null)
  const [filename, setFilename] = useState<string>("")

  const handleAnimationSelect = (animationName: string) => {
    setSelectedAnimationName(animationName)
    setStep("upload")
  }

  const handleFileLoad = (data: string, name: string) => {
    try {
      const parsed = parseAnimationFromC(data)
      // Override the animation name with the selected one
      parsed.name = selectedAnimationName
      setAnimation(parsed)
      setFilename(name)
      setStep("edit")
    } catch (error) {
      alert("Error parsing animation: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleBack = () => {
    if (step === "upload") {
      setStep("select")
      setSelectedAnimationName("")
    } else if (step === "edit") {
      setStep("upload")
      setAnimation(null)
      setFilename("")
    }
  }

  const handleExport = async () => {
    if (!animation) return
    
    // Derive the data file name from animation name
    const dataFileName = animation.name.replace(/^gPlayerAnim_/, "gPlayerAnimData_")
    const dataPath = `__OTR__objects/gameplay_keep/${dataFileName}`
    
    // Create binary files
    const dataBlob = animationDataToBlob(animation, dataFileName)
    const headerBlob = animationHeaderToBlob(animation, dataPath)
    
    const dataBuffer = await dataBlob.arrayBuffer()
    const headerBuffer = await headerBlob.arrayBuffer()
    
    // Create a zip file with the proper structure
    const zip = new JSZip()
    zip.file(`objects/gameplay_keep/${animation.name}`, headerBuffer)
    zip.file(`objects/gameplay_keep/${dataFileName}`, dataBuffer)
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" })
    
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${animation.name}.o2r`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportC = async () => {
    if (!animation) return
    
    const cSource = animationToC(animation)
    const blob = new Blob([cSource], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${animation.name}.c`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUpdateAnimation = (updatedAnimation: AnimationEntry) => {
    setAnimation(updatedAnimation)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileCode2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">SoH Animation Editor</h1>
              <p className="text-sm text-muted-foreground">Use Fast64 C outputs to override animation files for Ship of Harkinian</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {step === "select" && (
          <AnimationList onSelect={handleAnimationSelect} />
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Upload Animation Data</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Selected animation: <span className="font-mono text-primary">{selectedAnimationName}</span>
                </p>
              </div>
              <Button onClick={handleBack} variant="outline">
                ← Back
              </Button>
            </div>
            <FileUpload onFileLoad={handleFileLoad} />
          </div>
        )}

        {step === "edit" && animation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-foreground">Animation</h2>
                  <Button onClick={handleBack} variant="ghost" size="sm">
                    ← Back
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Source: {filename}
                </p>
                <p className="text-sm text-muted-foreground">
                  Export as: <span className="font-mono text-primary">{animation.name}</span>
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={handleExport} 
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export .o2r
                  </Button>
                  <Button 
                    onClick={handleExportC} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export .c
                  </Button>
                </div>
              </div>
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Summary</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Frame Count: {animation.frameCount}</div>
                  <div>Data Values: {animation.data.length}</div>
                  <div>Size: {animation.data.length * 2} bytes</div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <AnimationEditor animation={animation} onUpdate={handleUpdateAnimation} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
