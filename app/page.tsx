"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { MessageList } from "@/components/message-list"
import { MessageEditor } from "@/components/message-editor"
import { parseMessages, type MessageEntry, messageToBlob, messagesToBlob } from "@/lib/message-parser"
import { FileCode2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import JSZip from "jszip"

export default function Home() {
  const [messages, setMessages] = useState<MessageEntry[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [filename, setFilename] = useState<string>("")
  const [selectedForExport, setSelectedForExport] = useState<Set<number>>(new Set())

  const handleFileLoad = (data: Uint8Array, name: string) => {
    const parsed = parseMessages(data)
    setMessages(parsed)
    setFilename(name)
    // Start with no messages selected for export
    setSelectedForExport(new Set())
    if (parsed.length > 0) {
      setSelectedId(0)
    }
  }

  const handleExportSelected = async () => {
    const messagesToExport = messages.filter(m => selectedForExport.has(m.id))
    if (messagesToExport.length === 0) return
    
    const blob = messagesToBlob(messagesToExport)
    const binaryData = await blob.arrayBuffer()
    
    // Create a zip file with the proper structure
    const zip = new JSZip()
    zip.file("override/text/nes_message_data_static/nes_message_data_static", binaryData)
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" })
    
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = "messageOverrides.o2r"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleToggleExport = (id: number) => {
    setSelectedForExport(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleUpdateMessage = (updatedMessage: MessageEntry) => {
    setMessages((prevMessages) => 
      prevMessages.map((msg) => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    )
    // Automatically mark edited message for export
    setSelectedForExport(prev => new Set(prev).add(updatedMessage.id))
  }

  const selectedMessage = messages.find((m) => m.id === selectedId)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileCode2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">SoH Message Editor</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {messages.length === 0 ? (
          <FileUpload onFileLoad={handleFileLoad} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">{messages.length} Messages</h2>
                <p className="text-sm text-muted-foreground">
                  {filename}
                </p>
                <Button 
                  onClick={handleExportSelected} 
                  className="w-full mt-3"
                  disabled={selectedForExport.size === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedForExport.size} Message{selectedForExport.size !== 1 ? 's' : ''}
                </Button>
              </div>
              <MessageList 
                messages={messages} 
                selectedId={selectedId} 
                onSelect={setSelectedId}
                selectedForExport={selectedForExport}
                onToggleExport={handleToggleExport}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <MessageEditor message={selectedMessage} onUpdate={handleUpdateMessage} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a message to view details
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
