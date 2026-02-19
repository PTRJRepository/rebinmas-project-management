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

interface CreateTaskDialogProps {
    projectId: string
    statuses: Array<{ id: string; name: string }>
}

export function CreateTaskDialog({ projectId, statuses }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const result = await createTask(formData)
        setIsSubmitting(false)
        
        if (result.success) {
            console.log('[CreateTaskDialog] Task created successfully:', result.data)
            setOpen(false)
            router.refresh()
        } else {
            console.error('[CreateTaskDialog] Failed to create task:', result.error)
            alert('Failed to create task: ' + result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    aria-label="Create new task"
                >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Create New Task
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">
                                Add a new task to your project
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <input type="hidden" name="projectId" value={projectId} />

                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                            Task Title
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            required
                            placeholder="Enter task title..."
                            className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 h-11"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                            Description <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Provide task details..."
                            className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="statusId" className="text-sm font-semibold text-gray-700">
                                Status
                            </Label>
                            <select
                                id="statusId"
                                name="statusId"
                                required
                                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Dropdown */}
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">
                                Priority
                            </Label>
                            <select
                                id="priority"
                                name="priority"
                                defaultValue="MEDIUM"
                                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="LOW">🟢 Low</option>
                                <option value="MEDIUM">🟡 Medium</option>
                                <option value="HIGH">🟠 High</option>
                                <option value="CRITICAL">🔴 Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700">
                                Due Date <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 h-11"
                            />
                        </div>

                        {/* Estimated Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="estimatedHours" className="text-sm font-semibold text-gray-700">
                                Hours <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <Input
                                id="estimatedHours"
                                name="estimatedHours"
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 h-11"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-gray-200 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6"
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
