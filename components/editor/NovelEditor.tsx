'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { EditorMenuBar } from './EditorMenuBar';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface NovelEditorProps {
  content?: string;
  onChange?: (content: string, jsonContent?: object) => void;
  placeholder?: string;
  showMenuBar?: boolean;
  className?: string;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
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

export const NovelEditor = ({
  content = '',
  onChange,
  placeholder = 'Write something...',
  showMenuBar = true,
  className,
  editable = true,
  onImageUpload,
}: NovelEditorProps) => {
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-sky-400 underline hover:text-sky-300 cursor-pointer',
        },
      }),
      Typography,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-md',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange?.(html, json);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-slate max-w-none focus:outline-none',
          'prose-headings:text-slate-100 prose-headings:font-bold',
          'prose-p:text-slate-300 prose-p:leading-relaxed',
          'prose-strong:text-slate-100 prose-strong:font-semibold',
          'prose-code:text-sky-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700',
          'prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline',
          'prose-ul:text-slate-300 prose-ol:text-slate-300',
          'prose-li:text-slate-300',
          'prose-blockquote:border-slate-700 prose-blockquote:text-slate-400',
          'prose-hr:border-slate-700',
          'prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full',
          'prose-figure:my-4 prose-figcaption:text-sm prose-figcaption:text-slate-500 prose-figcaption:text-center',
          'min-h-[150px] px-4 py-3'
        ),
      },
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    setIsUploading(true)
    try {
      // Use custom upload handler if provided, otherwise use default compression
      if (onImageUpload) {
        const src = await onImageUpload(file)
        editor.chain().focus().setImage({ src }).run()
      } else {
        // Compress image on client side
        const compressed = await compressImage(file, 1200, 0.8)
        editor.chain().focus().setImage({ src: compressed }).run()
      }
    } catch (error) {
      console.error('Failed to process image:', error)
    } finally {
      setIsUploading(false)
    }
  }, [editor, onImageUpload])

  // Handle paste event for images
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    if (!editor || !editable) return

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
  }, [editor, editable, handleImageUpload])

  // Handle file drop
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    if (!editor || !editable) return

    event.preventDefault()
    const files = event.dataTransfer?.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type.indexOf('image') !== -1) {
        await handleImageUpload(file)
      }
    }
  }, [editor, editable, handleImageUpload])

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!editable) return
    event.preventDefault()
  }, [editable])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showMenuBar && (
        <EditorMenuBar
          editor={editor}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
      )}
      <div
        className={cn(
          'rounded-lg border overflow-hidden transition-colors',
          'border-slate-700 bg-slate-900',
          'focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500'
        )}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Help text for images */}
      {editable && (
        <div className="text-xs text-slate-500 px-2">
          Tip: Drag & drop images, copy-paste images, or use the image button. Images are compressed automatically.
        </div>
      )}
    </div>
  );
};

export default NovelEditor;
