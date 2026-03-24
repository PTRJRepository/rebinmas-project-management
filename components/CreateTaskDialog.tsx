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
import { Plus, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CreateTaskDialogProps {
    projectId: string
    statuses: Array<{ id: string; name: string }>
    onTaskCreated?: (task: any) => void
}

export function CreateTaskDialog({ projectId, statuses, onTaskCreated }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            const formData = new FormData(e.currentTarget)
            const dataObj = Object.fromEntries(formData)
            console.log('[CreateTaskDialog] START Submitting form:', dataObj)
            
            if (!dataObj.statusId) {
                console.error('[CreateTaskDialog] ERROR: statusId is missing from form data')
                toast({ variant: 'destructive', description: 'Status ID is required' })
                setIsSubmitting(false)
                return
            }

            const result = await createTask(formData)
            setIsSubmitting(false)
            
            console.log('[CreateTaskDialog] END result:', result)
            
            if (result.success) {
                console.log('[CreateTaskDialog] SUCCESS: Task created:', result.data)
                toast({ title: 'Tugas Berhasil Dibuat', description: `"${dataObj.title}" telah ditambahkan.` })
                setOpen(false)
                
                if (onTaskCreated && result.data) {
                    onTaskCreated(result.data)
                }
                
                setTimeout(() => {
                    router.refresh()
                }, 100)
            } else {
                console.error('[CreateTaskDialog] SERVER ERROR:', result.error)
                toast({ variant: 'destructive', title: 'Gagal Membuat Tugas', description: result.error })
            }
        } catch (err: any) {
            console.error('[CreateTaskDialog] CRITICAL CLIENT ERROR:', err)
            setIsSubmitting(false)
            toast({ variant: 'destructive', title: 'Fatal Error', description: err.message })
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
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border border-white/10 shadow-2xl side-panel-content">
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
                                Add a new task to your project
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <input type="hidden" name="projectId" value={projectId} />

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-slate-300">
                            Task Title
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            placeholder="Enter task title..."
                            className="bg-slate-900/50 border-white/10 focus:border-sky-500 focus:ring-sky-500 h-11 text-slate-100"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-slate-300">
                            Description <span className="text-slate-500 font-normal">(optional)</span>
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Provide task details..."
                            className="flex w-full rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="statusId" className="text-sm font-semibold text-slate-300">
                                Status
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
                            <Label htmlFor="priority" className="text-sm font-semibold text-slate-300">
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
                            <Label htmlFor="dueDate" className="text-sm font-semibold text-slate-300">
                                Due Date <span className="text-slate-500 font-normal">(optional)</span>
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
                            <Label htmlFor="estimatedHours" className="text-sm font-semibold text-slate-300">
                                Hours <span className="text-slate-500 font-normal">(optional)</span>
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
                            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg hover:shadow-sky-900/40 transition-all duration-200 px-6 border-0 text-white font-bold"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
