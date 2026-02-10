import { getTask } from '@/app/actions/task'
import { TaskDetailHeader } from '@/components/task/TaskDetailHeader'
import { TaskMetadata } from '@/components/task/TaskMetadata'
import { TaskDescriptionEditor } from '@/components/task/TaskDescriptionEditor'
import { notFound } from 'next/navigation'

export default async function TaskDetailPage({
    params,
}: {
    params: Promise<{ id: string; taskId: string }>
}) {
    const { id, taskId } = await params
    const { data: task, success } = await getTask(taskId)

    if (!success || !task) {
        notFound()
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <TaskDetailHeader
                task={task}
                projectId={id}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content Area (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description Section - Interactive Editor */}
                            <TaskDescriptionEditor task={task} projectId={id} />

                            {/* Comments Section (Future Enhancement) */}
                            {/* 
                            <div className="bg-white rounded-lg border border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Comments
                                </h2>
                                {task.comments && task.comments.length > 0 ? (
                                    <div className="space-y-4 p-6">
                                        {task.comments.map((comment) => (
                                            <div
                                                key={comment.id}
                                                className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                                            >
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                                        {comment.user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm text-gray-900">
                                                            {comment.user.username}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic p-6">No comments yet</p>
                                )}
                            </div>
                            */}

                            {/* Attachments Section (Future Enhancement) */}
                            {/* 
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Attachments
                                    </h2>
                                    <div className="space-y-2 p-6">
                                        {task.attachments.map((attachment) => (
                                            <a
                                                key={attachment.id}
                                                href={attachment.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {attachment.fileName}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            */}
                        </div>

                        {/* Sidebar (1/3) */}
                        <div className="space-y-6">
                            <TaskMetadata task={task} projectId={id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
