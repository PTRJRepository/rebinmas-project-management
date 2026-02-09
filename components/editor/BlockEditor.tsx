'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { cn } from '@/lib/utils';

export interface BlockEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export const BlockEditor = ({
  content = '',
  onChange,
  placeholder = "Type '/' for commands...",
  editable = true,
  className,
}: BlockEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('relative bg-white rounded-md border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all', className)}>
      <EditorContent editor={editor} />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(var(--color-secondary) / 0.6);
          pointer-events: none;
          height: 0;
        }

        /* Prose styling */
        .ProseMirror.prose {
          color: rgb(var(--color-secondary));
          font-size: 14px;
          line-height: 1.6;
        }

        .ProseMirror.prose h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          color: rgb(var(--color-secondary));
        }

        .ProseMirror.prose h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          color: rgb(var(--color-secondary));
        }

        .ProseMirror.prose h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          color: rgb(var(--color-secondary));
        }

        .ProseMirror.prose h4 {
          font-size: 1em;
          font-weight: 600;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          color: rgb(var(--color-secondary));
        }

        .ProseMirror.prose p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .ProseMirror.prose ul,
        .ProseMirror.prose ol {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          padding-left: 1.5em;
        }

        .ProseMirror.prose ul {
          list-style-type: disc;
        }

        .ProseMirror.prose ol {
          list-style-type: decimal;
        }

        .ProseMirror.prose li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        .ProseMirror.prose strong {
          font-weight: 700;
        }

        .ProseMirror.prose em {
          font-style: italic;
        }

        .ProseMirror.prose code {
          background-color: rgb(var(--bg-hover));
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-size: 0.875em;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .ProseMirror.prose pre {
          background-color: rgb(var(--bg-hover));
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        .ProseMirror.prose pre code {
          background-color: transparent;
          padding: 0;
        }

        .ProseMirror.prose a {
          color: rgb(var(--color-primary));
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
        }

        .ProseMirror.prose a:hover {
          color: rgb(var(--color-primary-hover));
        }

        .ProseMirror.prose blockquote {
          border-left: 3px solid rgb(var(--color-primary));
          padding-left: 1em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          color: rgb(var(--color-secondary) / 0.8);
          font-style: italic;
        }

        .ProseMirror.prose hr {
          border: none;
          border-top: 1px solid rgb(var(--color-secondary-light));
          margin-top: 1.5em;
          margin-bottom: 1.5em;
        }

        /* Task list styling */
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.25em;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
          width: 1em;
          height: 1em;
          margin-top: 0.25em;
          cursor: pointer;
          accent-color: rgb(var(--color-primary));
        }

        /* Selection styling */
        .ProseMirror ::selection {
          background-color: rgb(var(--color-primary-light));
        }

        /* Placeholder styling */
        .ProseMirror p.is-editor-empty {
          color: rgb(var(--color-secondary) / 0.5);
        }

        /* Image styling */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        /* Read-only mode */
        .ProseMirror.ProseMirror-readonly {
          opacity: 0.7;
          cursor: default;
        }
      `}</style>
    </div>
  );
};

export default BlockEditor;
