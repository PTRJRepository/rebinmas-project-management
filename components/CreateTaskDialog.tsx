'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTask } from '@/app/actions/task'
import { Plus, Sparkles, MapPin, Tag, Calendar, Clock, User, FileText, Flag } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'

interface CreateTaskDialogProps {
    projectId: string
    statuses: Array<{ id: string; name: string }>
    users?: Array<{ id: string; username: string; name: string; email: string }>
    onTaskCreated?: (task: any) => void
}

export function CreateTaskDialog({ projectId, statuses, users = [], onTaskCreated }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const router = useRouter()
    const { toast } = useToast()

    const handleAddTag = (e?: React.KeyboardEvent) => {
        if (e && e.key !== 'Enter') return
        e?.preventDefault()
        
        const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
        if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(prev => prev.filter(tag => tag !== tagToRemove))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)
            
            // Add tags to form data
            if (tags.length > 0) {
                formData.append('tags', tags.join(','))
            }

            const dataObj = Object.fromEntries(formData)
            console.log('[CreateTaskDialog] START Submitting form:', dataObj)

            if (!dataObj.statusId) {
                console.error('[CreateTaskDialog] ERROR: statusId is missing from form data')
                toast({ variant: 'destructive', description: 'Status ID is required' })
                setIsSubmitting(false)
                return
            }

            if (!dataObj.title || (dataObj.title as string).trim().length === 0) {
                console.error('[CreateTaskDialog] ERROR: title is required')
                toast({ variant: 'destructive', description: 'Judul task wajib diisi' })
                setIsSubmitting(false)
                return
            }

            const result = await createTask(formData)
            setIsSubmitting(false)

            console.log('[CreateTaskDialog] END result:', result)

            if (result.success) {
                console.log('[CreateTaskDialog] SUCCESS: Task created:', result.data)
                toast({ 
                    title: '✅ Task Berhasil Dibuat', 
                    description: `"${dataObj.title}" telah ditambahkan ke project.` 
                })
                setOpen(false)
                setTags([])

                if (onTaskCreated && result.data) {
                    onTaskCreated(result.data)
                }

                setTimeout(() => {
                    router.refresh()
                }, 100)
            } else {
                console.error('[CreateTaskDialog] SERVER ERROR:', result.error)
                toast({ variant: 'destructive', title: '❌ Gagal Membuat Task', description: result.error })
            }
        } catch (err: any) {
            console.error('[CreateTaskDialog] CRITICAL CLIENT ERROR:', err)
            setIsSubmitting(false)
            toast({ variant: 'destructive', title: '❌ Fatal Error', description: err.message })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 border-0"
                    aria-label="Create new task"
                >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] bg-slate-950 border border-white/10 shadow-2xl side-panel-content max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent font-space-grotesk">
                                Create New Task
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Fill in the details below to create a new task
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <input type="hidden" name="projectId" value={projectId} />

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-sky-400" />
                            Task Title <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            placeholder="e.g., Implement user authentication system"
                            className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-sky-400" />
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            rows={4}
                            placeholder="Provide detailed information about this task, including requirements, acceptance criteria, and any relevant notes..."
                            className="flex w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-400" />
                            Location <span className="text-slate-500 font-normal">(optional)</span>
                        </Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g., Office, Remote, Building A - Room 301"
                            className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-sky-400" />
                            Tags <span className="text-slate-500 font-normal">(optional)</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                name="tags-input"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Type tags and press Enter (e.g., frontend, urgent, bug)"
                                className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100 flex-1"
                            />
                            <Button
                                type="button"
                                onClick={() => handleAddTag()}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
                            >
                                Add
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-900/30 text-sky-400 border border-sky-700/50 text-sm"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-sky-200 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="statusId" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Flag className="h-4 w-4 text-sky-400" />
                                Status <span className="text-red-400">*</span>
                            </Label>
                            <select
                                id="statusId"
                                name="statusId"
                                required
                                className="flex h-11 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                            >
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id} className="bg-slate-950">
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Flag className="h-4 w-4 text-sky-400" />
                                Priority
                            </Label>
                            <select
                                id="priority"
                                name="priority"
                                defaultValue="MEDIUM"
                                className="flex h-11 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                            >
                                <option value="LOW" className="bg-slate-950">🟢 Low</option>
                                <option value="MEDIUM" className="bg-slate-950">🟡 Medium</option>
                                <option value="HIGH" className="bg-slate-950">🟠 High</option>
                                <option value="CRITICAL" className="bg-slate-950">🔴 Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-sky-400" />
                                Deadline <span className="text-slate-500 font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100 [color-scheme:dark]"
                            />
                        </div>

                        {/* Estimated Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="estimatedHours" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-sky-400" />
                                Estimated Hours <span className="text-slate-500 font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="estimatedHours"
                                name="estimatedHours"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Assignee */}
                    {users.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="assigneeId" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <User className="h-4 w-4 text-sky-400" />
                                Assign To <span className="text-slate-500 font-normal">(optional)</span>
                            </Label>
                            <select
                                id="assigneeId"
                                name="assigneeId"
                                className="flex h-11 w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                            >
                                <option value="" className="bg-slate-950">— Unassigned —</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id} className="bg-slate-950">
                                        {user.name} ({user.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg hover:shadow-sky-900/40 transition-all duration-200 px-6 border-0 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Task
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
