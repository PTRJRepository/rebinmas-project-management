'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
  placeholder?: string
  className?: string
}

// Image compression function
const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new (window.Image as any)()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compress and convert to base64
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Write something...',
  className = '',
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sky-400 underline hover:text-sky-300',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-slate max-w-none focus:outline-none min-h-[200px] px-4 py-3',
          'prose-headings:text-slate-100 prose-headings:font-bold',
          'prose-p:text-slate-300 prose-p:leading-relaxed',
          'prose-strong:text-slate-100 prose-strong:font-semibold',
          'prose-code:text-sky-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700',
          'prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline',
          'prose-ul:text-slate-300 prose-ol:text-slate-300',
          'prose-li:text-slate-300',
          'prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full',
          'placeholder:text-slate-500'
        ),
      },
    },
  })

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    setIsUploading(true)
    try {
      // Compress image on client side
      const compressed = await compressImage(file, 1200, 0.8)

      // Insert image into editor
      editor.chain().focus().setImage({ src: compressed }).run()
    } catch (error) {
      console.error('Failed to process image:', error)
    } finally {
      setIsUploading(false)
    }
  }, [editor])

  // Handle paste event for images
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    if (!editor) return

    const items = event.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleImageUpload(file)
        }
      }
    }
  }, [editor, handleImageUpload])

  // Handle file drop
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    if (!editor) return

    event.preventDefault()
    const files = event.dataTransfer?.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type.indexOf('image') !== -1) {
        await handleImageUpload(file)
      }
    }
  }, [editor, handleImageUpload])

  const MenuBar = () => {
    if (!editor) return null

    return (
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-800 border-b border-slate-700 rounded-t-lg">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('bold') ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('italic') ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('heading', { level: 3 }) ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('bulletList') ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('orderedList') ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Image Upload */}
        <label
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors cursor-pointer',
            isUploading ? 'text-amber-400' : 'text-slate-400'
          )}
          title="Insert Image"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ''
            }}
          />
          {isUploading ? (
            <div className="w-4 h-4 animate-spin border-2 border-amber-400 border-t-transparent rounded-full" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </label>

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('link') ? 'bg-slate-700 text-sky-400' : 'text-slate-400'
          )}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded mb-2 w-1/4" />
        <div className="h-4 bg-slate-800 rounded w-full mb-2" />
        <div className="h-4 bg-slate-800 rounded w-3/4" />
      </div>
    )
  }

  return (
    <div className={cn('bg-slate-900 border border-slate-700 rounded-lg overflow-hidden', className)}>
      {editable && <MenuBar />}

      <EditorContent
        editor={editor}
        onPaste={handlePaste}
        onDrop={handleDrop}
        className="min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar"
      />

      {/* Help text */}
      {editable && (
        <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700 text-xs text-slate-500">
          Tip: Drag & drop images, copy-paste images, or use the image button to insert. Images are compressed automatically.
        </div>
      )}
    </div>
  )
}
