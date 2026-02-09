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

interface NovelEditorProps {
  content?: string;
  onChange?: (content: string, jsonContent?: object) => void;
  placeholder?: string;
  showMenuBar?: boolean;
  className?: string;
  editable?: boolean;
}

export const NovelEditor = ({
  content = '',
  onChange,
  placeholder = 'Write something...',
  showMenuBar = true,
  className,
  editable = true,
}: NovelEditorProps) => {
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
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Typography,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
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
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none max-w-none',
          'min-h-[150px] px-4 py-3'
        ),
      },
    },
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showMenuBar && <EditorMenuBar editor={editor} />}
      <div className="rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default NovelEditor;
