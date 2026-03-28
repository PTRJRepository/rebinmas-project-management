'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  X,
  Circle,
  GitBranch,
  ArrowRight,
  Loader2,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  statusId: string
  statusName?: string
  dueDate: Date | null
  estimatedHours?: number | null
  assignee?: {
    id: string
    username: string
    name: string
    avatarUrl?: string | null
  } | null
  dependsOn?: string[]
}

interface Status {
  id: string
  name: string
  order: number
}

interface ProjectGraphProps {
  tasks: Task[]
  statuses: Status[]
  projectId: string
  projectName?: string
}

interface Node {
  id: string
  task: Task
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  CRITICAL: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' },
  HIGH: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/50' },
  MEDIUM: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' },
  LOW: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', glow: 'shadow-green-500/50' },
}

const STATUS_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-amber-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-500',
]

export function ProjectGraph({ tasks, statuses, projectId, projectName = 'Project' }: ProjectGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPriority = !filterPriority || task.priority === filterPriority
      const matchesAssignee = !filterAssignee || task.assignee?.id === filterAssignee
      return matchesSearch && matchesPriority && matchesAssignee
    })
  }, [tasks, searchQuery, filterPriority, filterAssignee])

  // Get unique assignees
  const assignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    tasks.forEach(task => {
      if (task.assignee) {
        map.set(task.assignee.id, { id: task.assignee.id, name: task.assignee.name })
      }
    })
    return Array.from(map.values())
  }, [tasks])

  // Calculate node positions (grid layout organized by status)
  const { nodes, edges } = useMemo(() => {
    const nodeWidth = 220
    const nodeHeight = 80
    const horizontalGap = 80
    const verticalGap = 40
    const nodesPerRow = Math.max(1, Math.floor((typeof window !== 'undefined' ? window.innerWidth - 200 : 1200) / (nodeWidth + horizontalGap)))

    const nodeMap = new Map<string, Node>()
    const edgeList: Edge[] = []

    // Group tasks by status
    const tasksByStatus = new Map<string, Task[]>()
    statuses.forEach(status => {
      tasksByStatus.set(status.id, [])
    })
    filteredTasks.forEach(task => {
      const list = tasksByStatus.get(task.statusId) || []
      list.push(task)
      tasksByStatus.set(task.statusId, list)
    })

    // Calculate positions
    let currentX = 50
    let currentY = 50

    statuses.forEach((status, statusIndex) => {
      const statusTasks = tasksByStatus.get(status.id) || []

      if (statusTasks.length === 0) return

      // Status header position
      const headerX = currentX
      const headerY = currentY

      // Tasks in this status
      statusTasks.forEach((task, taskIndex) => {
        const row = Math.floor(taskIndex / 1)
        const x = currentX + taskIndex * (nodeWidth + horizontalGap)
        const y = currentY + 50 + row * (nodeHeight + verticalGap)

        nodeMap.set(task.id, {
          id: task.id,
          task,
          x,
          y,
          width: nodeWidth,
          height: nodeHeight
        })
      })

      // Move to next column
      currentX += (statusTasks.length || 1) * (nodeWidth + horizontalGap) + 100

      // Create edges based on task flow (sequential status order)
      statusTasks.forEach(task => {
        // Find tasks in next status that could depend on this
        const nextStatusIndex = statuses.findIndex(s => s.id === task.statusId) + 1
        if (nextStatusIndex < statuses.length) {
          const nextStatus = statuses[nextStatusIndex]
          const nextTasks = tasksByStatus.get(nextStatus.id) || []
          nextTasks.slice(0, 1).forEach(nextTask => {
            const fromNode = nodeMap.get(task.id)
            const toNode = nodeMap.get(nextTask.id)
            if (fromNode && toNode) {
              edgeList.push({
                from: task.id,
                to: nextTask.id,
                fromX: fromNode.x + nodeWidth,
                fromY: fromNode.y + nodeHeight / 2,
                toX: toNode.x,
                toY: toNode.y + nodeHeight / 2
              })
            }
          })
        }
      })
    })

    return { nodes: nodeMap, edges: edgeList }
  }, [filteredTasks, statuses])

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Zoom handlers
  const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 3))
  const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.3))
  const handleFit = () => {
    setScale(1)
    setOffset({ x: 50, y: 50 })
  }

  // Calculate SVG viewBox
  const svgWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const svgHeight = typeof window !== 'undefined' ? window.innerHeight - 200 : 800

  return (
    <div className="relative w-full h-full bg-slate-950/50 overflow-hidden">
      {/* Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-slate-900/80 border-white/10 pl-10 h-9 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-white/10 h-9",
              showFilters ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "text-slate-400"
            )}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(filterPriority || filterAssignee) && (
              <Badge variant="secondary" className="ml-2 bg-sky-500/30 text-sky-400 text-xs">
                {[filterPriority, filterAssignee].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl rounded-lg p-1 border border-white/10">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8 text-slate-400 hover:text-white">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-400 w-12 text-center font-mono">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8 text-slate-400 hover:text-white">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-[1px] h-6 bg-white/10" />
          <Button variant="ghost" size="icon" onClick={handleFit} className="h-8 w-8 text-slate-400 hover:text-white">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-16 left-4 z-20 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl min-w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRIORITY_COLORS).map(priority => (
                  <Badge
                    key={priority}
                    variant="outline"
                    onClick={() => setFilterPriority(filterPriority === priority ? null : priority)}
                    className={cn(
                      "cursor-pointer transition-all",
                      filterPriority === priority
                        ? `${PRIORITY_COLORS[priority].bg} ${PRIORITY_COLORS[priority].border} ${PRIORITY_COLORS[priority].text}`
                        : "border-white/10 text-slate-400 hover:bg-white/5"
                    )}
                  >
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Assignee</label>
              <div className="flex flex-wrap gap-2">
                {assignees.length === 0 ? (
                  <span className="text-xs text-slate-500">No assignees</span>
                ) : (
                  assignees.map(assignee => (
                    <Badge
                      key={assignee.id}
                      variant="outline"
                      onClick={() => setFilterAssignee(filterAssignee === assignee.id ? null : assignee.id)}
                      className={cn(
                        "cursor-pointer transition-all",
                        filterAssignee === assignee.id
                          ? "bg-sky-500/20 border-sky-500 text-sky-400"
                          : "border-white/10 text-slate-400 hover:bg-white/5"
                      )}
                    >
                      <User className="w-3 h-3 mr-1" />
                      {assignee.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {(filterPriority || filterAssignee) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterPriority(null); setFilterAssignee(null) }}
                className="text-slate-400 hover:text-white text-xs"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <defs>
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148, 163, 184, 0.5)" />
            </marker>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* Edges */}
            {edges.map((edge, i) => {
              // Calculate bezier curve control points
              const midX = (edge.fromX + edge.toX) / 2
              const controlY1 = edge.fromY
              const controlY2 = edge.toY

              return (
                <g key={`edge-${i}`}>
                  {/* Shadow line */}
                  <path
                    d={`M ${edge.fromX} ${edge.fromY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${edge.toX} ${edge.toY}`}
                    stroke="rgba(0, 0, 0, 0.5)"
                    strokeWidth="3"
                    fill="none"
                    className="transition-all duration-300"
                  />
                  {/* Main line */}
                  <path
                    d={`M ${edge.fromX} ${edge.fromY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${edge.toX} ${edge.toY}`}
                    stroke="rgba(148, 163, 184, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-300"
                  />
                </g>
              )
            })}

            {/* Status Headers */}
            {Array.from(nodes.values()).length > 0 && (
              <>
                {(() => {
                  const statusGroups = new Map<string, Node[]>()
                  nodes.forEach(node => {
                    const statusId = node.task.statusId
                    if (!statusGroups.has(statusId)) statusGroups.set(statusId, [])
                    statusGroups.get(statusId)!.push(node)
                  })

                  return Array.from(statusGroups.entries()).map(([statusId, statusNodes], statusIndex) => {
                    const status = statuses.find(s => s.id === statusId)
                    const firstNode = statusNodes[0]
                    const statusColor = STATUS_COLORS[statusIndex % STATUS_COLORS.length]

                    return (
                      <g key={`status-${statusId}`}>
                        {/* Status header background */}
                        <rect
                          x={firstNode.x - 10}
                          y={firstNode.y - 35}
                          width={Math.max(...statusNodes.map(n => n.width)) + 20}
                          height={28}
                          rx={6}
                          className="fill-slate-900/90 stroke-white/10"
                          strokeWidth={1}
                        />
                        {/* Status indicator */}
                        <div
                          className={`w-2 h-2 rounded-full bg-gradient-to-br ${statusColor}`}
                        />
                        <circle
                          cx={firstNode.x + 6}
                          cy={firstNode.y - 21}
                          r={5}
                          className={`fill-current bg-gradient-to-br ${statusColor}`}
                        />
                        {/* Status name */}
                        <text
                          x={firstNode.x + 18}
                          y={firstNode.y - 16}
                          className="fill-white text-xs font-bold"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {status?.name || 'Unknown'}
                        </text>
                        {/* Task count */}
                        <text
                          x={firstNode.x + 18 + (status?.name || 'Unknown').length * 6}
                          y={firstNode.y - 16}
                          className="fill-slate-500 text-[10px]"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {' '}({statusNodes.length})
                        </text>
                      </g>
                    )
                  })
                })()}
              </>
            )}

            {/* Nodes */}
            {Array.from(nodes.values()).map(node => {
              const priorityColors = PRIORITY_COLORS[node.task.priority] || PRIORITY_COLORS.MEDIUM
              const isHovered = hoveredTask === node.id
              const isSelected = selectedTask === node.id
              const statusIndex = statuses.findIndex(s => s.id === node.task.statusId)
              const statusColor = STATUS_COLORS[statusIndex % STATUS_COLORS.length]

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredTask(node.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => setSelectedTask(selectedTask === node.id ? null : node.id)}
                  style={{ cursor: 'pointer' }}
                  className="transition-transform duration-200"
                >
                  {/* Glow effect for hovered/selected */}
                  {(isHovered || isSelected) && (
                    <rect
                      x={-4}
                      y={-4}
                      width={node.width + 8}
                      height={node.height + 8}
                      rx={14}
                      className={`fill-none stroke-2 ${isSelected ? 'stroke-sky-500' : 'stroke-slate-400'}`}
                      filter="url(#glow)"
                      opacity={0.8}
                    />
                  )}

                  {/* Node background */}
                  <rect
                    x={0}
                    y={0}
                    width={node.width}
                    height={node.height}
                    rx={10}
                    className={`fill-slate-900/95 ${isHovered || isSelected ? 'stroke-white/30' : 'stroke-white/10'}`}
                    strokeWidth={1.5}
                  />

                  {/* Priority indicator bar */}
                  <rect
                    x={0}
                    y={0}
                    width={4}
                    height={node.height}
                    rx={2}
                    className={`${priorityColors.bg}`}
                  />

                  {/* Status color accent */}
                  <rect
                    x={0}
                    y={0}
                    width={node.width}
                    height={3}
                    rx={2}
                    className={`bg-gradient-to-r ${statusColor}`}
                  />

                  {/* Task title */}
                  <foreignObject x={12} y={10} width={node.width - 24} height={35}>
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-medium text-white leading-tight line-clamp-2"
                        style={{ wordBreak: 'break-word' }}
                      >
                        {node.task.title}
                      </span>
                    </div>
                  </foreignObject>

                  {/* Task meta row */}
                  <g transform={`translate(12, ${node.height - 28})`}>
                    {/* Priority badge */}
                    <rect
                      x={0}
                      y={0}
                      width={50}
                      height={18}
                      rx={4}
                      className={priorityColors.bg}
                    />
                    <text
                      x={25}
                      y={12}
                      textAnchor="middle"
                      className={`fill-current text-[10px] font-bold ${priorityColors.text}`}
                      style={{ fontFamily: 'inherit' }}
                    >
                      {node.task.priority}
                    </text>

                    {/* Assignee */}
                    {node.task.assignee && (
                      <>
                        <circle
                          cx={node.width - 40}
                          cy={9}
                          r={7}
                          className="fill-slate-700 stroke-slate-600"
                          strokeWidth={1}
                        />
                        <text
                          x={node.width - 40}
                          y={12}
                          textAnchor="middle"
                          className="fill-white text-[9px] font-medium"
                          style={{ fontFamily: 'inherit' }}
                        >
                          {node.task.assignee.name.charAt(0).toUpperCase()}
                        </text>
                      </>
                    )}

                    {/* Due date indicator */}
                    {node.task.dueDate && (
                      <g transform={`translate(${node.width - 70}, 2)`}>
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <text
                          x={8}
                          y={10}
                          className={`text-[9px] ${new Date(node.task.dueDate) < new Date() ? 'fill-red-400' : 'fill-slate-500'}`}
                          style={{ fontFamily: 'inherit' }}
                        >
                          {new Date(node.task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && nodes.has(selectedTask) && (
        <div className="absolute bottom-4 right-4 z-30 w-96 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-bold">{nodes.get(selectedTask)?.task.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn(
                    "text-xs",
                    PRIORITY_COLORS[nodes.get(selectedTask)?.task.priority || 'MEDIUM']?.bg,
                    PRIORITY_COLORS[nodes.get(selectedTask)?.task.priority || 'MEDIUM']?.border,
                    PRIORITY_COLORS[nodes.get(selectedTask)?.task.priority || 'MEDIUM']?.text
                  )}>
                    {nodes.get(selectedTask)?.task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-white/10 text-slate-400">
                    {statuses.find(s => s.id === nodes.get(selectedTask)?.task.statusId)?.name}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {nodes.get(selectedTask)?.task.assignee && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {nodes.get(selectedTask)?.task.assignee?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assignee</p>
                  <p className="text-sm text-white">{nodes.get(selectedTask)?.task.assignee?.name}</p>
                </div>
              </div>
            )}

            {nodes.get(selectedTask)?.task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-400">Due Date</p>
                  <p className={cn(
                    "text-sm",
                    new Date(nodes.get(selectedTask)?.task.dueDate!) < new Date() ? "text-red-400" : "text-white"
                  )}>
                    {new Date(nodes.get(selectedTask)?.task.dueDate!).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {nodes.get(selectedTask)?.task.estimatedHours && (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-400">Estimated Hours</p>
                  <p className="text-sm text-white">{nodes.get(selectedTask)?.task.estimatedHours}h</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl rounded-lg px-4 py-2 border border-white/10">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-400">Nodes:</span>
          <span className="text-xs font-bold text-white">{nodes.size}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400">Edges:</span>
          <span className="text-xs font-bold text-white">{edges.length}</span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Circle className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-400">Status:</span>
          <span className="text-xs font-bold text-white">{statuses.length}</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <GitBranch className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 mb-2">No tasks found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters or search query</p>
          </div>
        </div>
      )}
    </div>
  )
}
