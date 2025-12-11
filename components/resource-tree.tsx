"use client"

import { ChevronRight, ChevronDown, File, Folder } from "lucide-react"
import { useState } from "react"
import { ResourceEntry } from "@/lib/o2r-parser"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface ResourceTreeProps {
  resources: ResourceEntry[]
  selectedPath: string | null
  onResourceSelect: (path: string) => void
}

interface TreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: TreeNode[]
  resource?: ResourceEntry
}

/**
 * Build a tree structure from flat resource paths
 */
function buildTree(resources: ResourceEntry[]): TreeNode {
  const root: TreeNode = { name: '', path: '', isDirectory: true, children: [] }
  
  for (const resource of resources) {
    const parts = resource.path.split('/').filter(p => p.length > 0)
    let current = root
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLastPart = i === parts.length - 1
      const pathSoFar = parts.slice(0, i + 1).join('/')
      
      let child = current.children.find(c => c.name === part)
      
      if (!child) {
        child = {
          name: part,
          path: pathSoFar,
          isDirectory: !isLastPart,
          children: [],
          resource: isLastPart ? resource : undefined,
        }
        current.children.push(child)
      }
      
      current = child
    }
  }
  
  // Sort: directories first, then files, both alphabetically
  function sortNode(node: TreeNode) {
    node.children.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    
    for (const child of node.children) {
      sortNode(child)
    }
  }
  
  sortNode(root)
  
  return root
}

interface TreeNodeComponentProps {
  node: TreeNode
  level: number
  selectedPath: string | null
  onResourceSelect: (path: string) => void
  expandedNodes: Set<string>
  onToggleExpand: (path: string) => void
}

function TreeNodeComponent({ node, level, selectedPath, onResourceSelect, expandedNodes, onToggleExpand }: TreeNodeComponentProps) {
  const isExpanded = expandedNodes.has(node.path)
  const isSelected = selectedPath === node.path
  
  const handleClick = () => {
    if (node.isDirectory) {
      onToggleExpand(node.path)
    } else {
      onResourceSelect(node.path)
    }
  }
  
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm transition-colors",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!node.isDirectory && <span className="w-4" />}
        {node.isDirectory ? (
          <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
        ) : (
          <File className="h-4 w-4 flex-shrink-0 text-gray-500" />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        {node.resource && (
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {node.resource.header.resourceType}
          </span>
        )}
      </div>
      {node.isDirectory && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onResourceSelect={onResourceSelect}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ResourceTree({ resources, selectedPath, onResourceSelect }: ResourceTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  const tree = buildTree(resources)
  
  const handleToggleExpand = (path: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }
  
  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No resources loaded</p>
      </div>
    )
  }
  
  return (
    <div className="p-2">
    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
        RESOURCES ({resources.length})
    </div>
    {tree.children.map((child) => (
        <TreeNodeComponent
        key={child.path}
        node={child}
        level={0}
        selectedPath={selectedPath}
        onResourceSelect={onResourceSelect}
        expandedNodes={expandedNodes}
        onToggleExpand={handleToggleExpand}
        />
    ))}
    </div>
  )
}
