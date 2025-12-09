"use client"

import { type AnimationEntry, animationToC } from "@/lib/animation-parser"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Code2, Edit, Eye, Save, X, Copy } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AnimationEditorProps {
  animation: AnimationEntry
  onUpdate?: (animation: AnimationEntry) => void
}

export function AnimationEditor({ animation, onUpdate }: AnimationEditorProps) {
  const [view, setView] = useState<"info" | "hex" | "edit">("info")
  const [editName, setEditName] = useState(animation.name)
  const [editFrameCount, setEditFrameCount] = useState(animation.frameCount.toString())
  const [editData, setEditData] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setEditName(animation.name)
    setEditFrameCount(animation.frameCount.toString())
    setEditData(Array.from(animation.data).map(v => 
      v < 0 ? `-0x${(-v).toString(16).toUpperCase().padStart(4, '0')}` : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`
    ).join(", "))
    setHasChanges(false)
  }, [animation])

  const handleSave = () => {
    if (onUpdate) {
      try {
        // Parse the hex values
        const hexValues = editData.match(/(?:0x[0-9A-Fa-f]+|-0x[0-9A-Fa-f]+)/g)
        if (!hexValues) {
          alert("Invalid data format")
          return
        }

        const newData = new Int16Array(hexValues.length)
        for (let i = 0; i < hexValues.length; i++) {
          newData[i] = parseInt(hexValues[i], 16)
        }

        const updatedAnimation: AnimationEntry = {
          name: editName,
          frameCount: parseInt(editFrameCount, 10),
          data: newData,
        }
        onUpdate(updatedAnimation)
        setHasChanges(false)
      } catch (error) {
        alert("Error parsing animation data: " + (error instanceof Error ? error.message : "Unknown error"))
      }
    }
  }

  const handleCancel = () => {
    setEditName(animation.name)
    setEditFrameCount(animation.frameCount.toString())
    setEditData(Array.from(animation.data).map(v => 
      v < 0 ? `-0x${(-v).toString(16).toUpperCase().padStart(4, '0')}` : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`
    ).join(", "))
    setHasChanges(false)
    setView("info")
  }

  const handleCopyC = async () => {
    const cSource = animationToC(animation)
    await navigator.clipboard.writeText(cSource)
    alert("C source copied to clipboard!")
  }

  const renderHexDump = () => {
    const lines: string[] = []
    const valuesPerLine = 8
    
    for (let i = 0; i < animation.data.length; i += valuesPerLine) {
      const values = []
      for (let j = 0; j < valuesPerLine && i + j < animation.data.length; j++) {
        const value = animation.data[i + j]
        const hexStr = value < 0 
          ? `-0x${(-value).toString(16).toUpperCase().padStart(4, '0')}` 
          : `0x${value.toString(16).toUpperCase().padStart(4, '0')}`
        values.push(hexStr.padStart(7, ' '))
      }
      lines.push(`${(i * 2).toString(16).toUpperCase().padStart(4, '0')}: ${values.join(' ')}`)
    }
    
    return lines.join('\n')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-mono font-semibold text-foreground">{animation.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Frames: {animation.frameCount} | Data Values: {animation.data.length} | Size: {animation.data.length * 2} bytes
            {hasChanges && <span className="ml-2 text-amber-500">• Unsaved changes</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyC}>
            <Copy className="w-4 h-4 mr-2" />
            Copy C
          </Button>
          <Button variant={view === "info" ? "default" : "outline"} size="sm" onClick={() => setView("info")}>
            <Eye className="w-4 h-4 mr-2" />
            Info
          </Button>
          <Button variant={view === "edit" ? "default" : "outline"} size="sm" onClick={() => setView("edit")}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant={view === "hex" ? "default" : "outline"} size="sm" onClick={() => setView("hex")}>
            <Code2 className="w-4 h-4 mr-2" />
            Hex
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <ScrollArea className="h-[calc(100vh-20rem)]">
          {view === "edit" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Edit Animation</h3>
                <div className="flex gap-2">
                  {hasChanges && (
                    <>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="anim-name">Animation Name</Label>
                  <Input
                    id="anim-name"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value)
                      setHasChanges(true)
                    }}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="frame-count">Frame Count</Label>
                  <Input
                    id="frame-count"
                    type="number"
                    value={editFrameCount}
                    onChange={(e) => {
                      setEditFrameCount(e.target.value)
                      setHasChanges(true)
                    }}
                    className="font-mono"
                  />
                </div>
                
                <div>
                  <Label htmlFor="anim-data">Animation Data (s16 hex values)</Label>
                  <Textarea
                    id="anim-data"
                    value={editData}
                    onChange={(e) => {
                      setEditData(e.target.value)
                      setHasChanges(true)
                    }}
                    className="font-mono text-xs min-h-[400px]"
                    placeholder="0x0021, 0x0A78, -0x0016, ..."
                  />
                </div>
              </div>
            </div>
          ) : view === "hex" ? (
            <div>
              <h3 className="font-semibold mb-4">Hex Dump</h3>
              <pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                {renderHexDump()}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Animation Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="font-mono">{animation.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frame Count:</span>
                    <div className="font-mono">{animation.frameCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Values:</span>
                    <div className="font-mono">{animation.data.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Binary Size:</span>
                    <div className="font-mono">{animation.data.length * 2} bytes</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Data Preview (first 64 values)</h3>
                <pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {Array.from(animation.data.slice(0, 64)).map((v, i) => {
                    const hexStr = v < 0 
                      ? `-0x${(-v).toString(16).toUpperCase().padStart(4, '0')}` 
                      : `0x${v.toString(16).toUpperCase().padStart(4, '0')}`
                    return (i % 8 === 0 ? '\n' : '') + hexStr.padStart(7, ' ') + (i < 63 ? ',' : '')
                  }).join(' ')}
                  {animation.data.length > 64 && '\n...'}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">C Source Preview</h3>
                <pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md max-h-[300px] overflow-auto">
                  {animationToC(animation)}
                </pre>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
