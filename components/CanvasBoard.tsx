'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { X, Save, Grid3x3, PenTool, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamic import for Excalidraw to avoid SSR issues
const ExcalidrawWrapper = dynamic(
  () => import('./ExcalidrawWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200 text-lg">Loading Canvas...</p>
        </div>
      </div>
    ),
  }
)

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  status?: string
  dueDate?: Date | null
  assignee?: {
    username: string
  } | null
}

interface CanvasBoardProps {
  projectId: string
  projectName: string
  tasks: Task[]
  onSave?: (data: any) => void
  initialData?: any
}

export function CanvasBoard({ projectId, projectName, tasks, onSave, initialData }: CanvasBoardProps) {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200 text-lg">Loading Canvas...</p>
        </div>
      </div>
    }>
      <CanvasBoardInner
        projectId={projectId}
        projectName={projectName}
        tasks={tasks}
        onSave={onSave}
        initialData={initialData}
      />
    </Suspense>
  )
}

function CanvasBoardInner({ projectId, projectName, tasks, onSave, initialData }: CanvasBoardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Save canvas content
  const handleSave = async () => {
    if (!excalidrawAPI) return

    try {
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()

      // Get canvas as data URL for preview thumbnail
      const canvasDataUrl = await excalidrawAPI.exportToBlob({
        mimeType: 'image/png',
        quality: 0.8,
      }).then((blob: Blob) => {
        return URL.createObjectURL(blob)
      }).catch(() => null)

      const content = {
        elements,
        appState: {
          ...appState,
          // Store essential state only
          name: appState.name,
          viewBackgroundColor: appState.viewBackgroundColor,
        },
        projectId,
        updatedAt: new Date().toISOString()
      }

      // Save to localStorage as backup (without files which are binary)
      try {
        localStorage.setItem(`canvas-${projectId}`, JSON.stringify(content))
      } catch (e) {
        console.warn('Failed to save canvas to localStorage:', e)
      }

      // Save to database via API
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })

      if (!res.ok) {
        console.error('Failed to save canvas to server')
      }

      // Show success feedback
      const saveBtn = document.querySelector('[data-save-canvas-btn]')
      if (saveBtn) {
        saveBtn.textContent = 'Tersimpan!'
        setTimeout(() => {
          saveBtn.textContent = 'Save'
        }, 2000)
      }
    } catch (e) {
      console.error('Error saving canvas:', e)
    }
  }

  // Generate initial canvas with tasks as sticky notes
  const initializeWithTasks = async () => {
    if (!excalidrawAPI || isInitialized) return

    try {
      const elements: any[] = []
      let yOffset = 100
      const xOffset = 100
      const cardWidth = 200
      const cardHeight = 120
      const gap = 50

      // Add title
      elements.push({
        id: `title-${Date.now()}`,
        type: 'text',
        x: 400,
        y: 30,
        text: projectName,
        fontSize: 36,
        fontFamily: 1,
        strokeWidth: 2,
        stroke: '#1e1e1e',
        isDeleted: false,
      })

      // Add tasks as rectangles with text
      tasks.forEach((task, index) => {
        const col = index % 4
        const row = Math.floor(index / 4)
        const x = xOffset + col * (cardWidth + gap)
        const y = yOffset + row * (cardHeight + gap)

        // Determine color based on priority
        let bgColor = '#ffffff'
        let strokeColor = '#000000'

        if (task.priority === 'CRITICAL') {
          strokeColor = '#ef4444'
        } else if (task.priority === 'HIGH') {
          strokeColor = '#f97316'
        } else if (task.priority === 'MEDIUM') {
          strokeColor = '#eab308'
        } else if (task.priority === 'LOW') {
          strokeColor = '#22c55e'
        }

        // Rectangle background
        elements.push({
          id: `task-bg-${task.id}`,
          type: 'rectangle',
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          strokeColor,
          backgroundColor: bgColor,
          strokeWidth: 2,
          roughness: 0,
          opacity: 100,
          isDeleted: false,
          seed: Math.floor(Math.random() * 100000),
        })

        // Task title
        elements.push({
          id: `task-title-${task.id}`,
          type: 'text',
          x: x + 10,
          y: y + 15,
          text: task.title?.substring(0, 30) + (task.title?.length > 30 ? '...' : '') || '',
          fontSize: 16,
          fontFamily: 1,
          strokeWidth: 1,
          stroke: '#1e1e1e',
          isDeleted: false,
        })

        // Task status
        if (task.status) {
          elements.push({
            id: `task-status-${task.id}`,
            type: 'text',
            x: x + 10,
            y: y + 45,
            text: task.status,
            fontSize: 12,
            fontFamily: 1,
            strokeWidth: 1,
            stroke: '#666666',
            isDeleted: false,
          })
        }

        // Assignee
        if (task.assignee) {
          elements.push({
            id: `task-assignee-${task.id}`,
            type: 'text',
            x: x + 10,
            y: y + 65,
            text: `@${task.assignee.username}`,
            fontSize: 12,
            fontFamily: 1,
            strokeWidth: 1,
            stroke: '#666666',
            isDeleted: false,
          })
        }

        // Due date
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate).toLocaleDateString()
          elements.push({
            id: `task-due-${task.id}`,
            type: 'text',
            x: x + 10,
            y: y + 85,
            text: `Due: ${dueDate}`,
            fontSize: 11,
            fontFamily: 1,
            strokeWidth: 1,
            stroke: '#ef4444',
            isDeleted: false,
          })
        }
      })

      // Add legend
      elements.push({
        id: 'legend-title',
        type: 'text',
        x: 100,
        y: 600,
        text: 'Priority:',
        fontSize: 14,
        fontFamily: 1,
        strokeWidth: 2,
        stroke: '#1e1e1e',
        isDeleted: false,
      })

      const priorities = [
        { label: 'Critical', color: '#ef4444' },
        { label: 'High', color: '#f97316' },
        { label: 'Medium', color: '#eab308' },
        { label: 'Low', color: '#22c55e' }
      ]

      let legendX = 200
      priorities.forEach(prio => {
        elements.push({
          id: `legend-${prio.label}`,
          type: 'rectangle',
          x: legendX,
          y: 595,
          width: 20,
          height: 20,
          strokeColor: prio.color,
          backgroundColor: prio.color,
          strokeWidth: 2,
          roughness: 0,
          isDeleted: false,
          seed: Math.floor(Math.random() * 100000),
        })

        elements.push({
          id: `legend-text-${prio.label}`,
          type: 'text',
          x: legendX + 30,
          y: 600,
          text: prio.label,
          fontSize: 12,
          fontFamily: 1,
          strokeWidth: 1,
          stroke: '#666666',
          isDeleted: false,
        })

        legendX += 100
      })

      await excalidrawAPI.updateScene({
        elements
      })

      setIsInitialized(true)
    } catch (e) {
      console.error('Error initializing canvas:', e)
    }
  }

  // Auto-save on change
  useEffect(() => {
    if (!excalidrawAPI) return

    const interval = setInterval(() => {
      handleSave()
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(interval)
  }, [excalidrawAPI])

  // Load saved content or initialize with tasks when API is ready
  useEffect(() => {
    if (!excalidrawAPI) return

    const loadContent = async () => {
      // Try loading from server API first (persistent storage)
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`)
        if (res.ok) {
          const data = await res.json()
          if (data.elements && data.elements.length > 0) {
            await excalidrawAPI.updateScene({
              elements: data.elements || [],
              appState: data.appState || {}
            })
            setIsInitialized(true)
            return
          }
        }
      } catch (e) {
        console.error('Error loading canvas from server:', e)
      }

      // Fall back to localStorage
      const saved = localStorage.getItem(`canvas-${projectId}`)
      if (saved) {
        try {
          const content = JSON.parse(saved)
          if (content.elements && content.elements.length > 0) {
            await excalidrawAPI.updateScene({
              elements: content.elements || [],
              appState: content.appState
            })
            setIsInitialized(true)
            return
          }
        } catch (e) {
          console.error('Error loading canvas from localStorage:', e)
        }
      }

      // No saved content, initialize with tasks
      if (tasks.length > 0) {
        setTimeout(() => initializeWithTasks(), 500)
      } else {
        setIsInitialized(true)
      }
    }

    loadContent()
  }, [excalidrawAPI, projectId])

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col">
      {/* Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-semibold">{projectName}</span>
          <span className="text-slate-600 text-sm">Canvas View</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={initializeWithTasks}
            className="bg-slate-200 border-slate-400 text-slate-800 hover:bg-slate-300"
            disabled={!excalidrawAPI}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Generate from Tasks
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            className="bg-sky-600 border-sky-500 text-white hover:bg-sky-700"
            disabled={!excalidrawAPI}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative" ref={canvasRef}>
        <ExcalidrawWrapper
          onReady={(api: any) => setExcalidrawAPI(api)}
          onChange={() => {
            // Auto-save handled by interval
          }}
        />
      </div>

      {/* Floating Help */}
      <div className="absolute bottom-4 left-4 bg-slate-100 border border-slate-300 p-3 rounded-lg shadow-lg max-w-xs">
        <p className="text-sm font-semibold mb-1">Tips:</p>
        <ul className="text-xs text-slate-700 space-y-1">
          <li>• Drag tasks to reposition</li>
          <li>• Add images/notes from toolbar</li>
          <li>• Draw arrows to connect tasks</li>
          <li>• Auto-save every 30 seconds</li>
        </ul>
      </div>
    </div>
  )
}
