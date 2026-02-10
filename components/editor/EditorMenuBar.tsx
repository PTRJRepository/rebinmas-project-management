import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Image,
  Link,
  RemoveFormatting,
  Image as ImageIcon,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRef } from 'react';

interface EditorMenuBarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export const EditorMenuBar = ({ editor, onImageUpload, isUploading = false }: EditorMenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addImageFromUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
            className={editor.isActive('bold') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
            className={editor.isActive('italic') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline"
            className={editor.isActive('underline') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
            className={editor.isActive('strike') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Code"
            className={editor.isActive('code') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
            className={editor.isActive('heading', { level: 1 }) ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
            className={editor.isActive('heading', { level: 2 }) ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
            className={editor.isActive('heading', { level: 3 }) ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            className={editor.isActive('bulletList') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
            className={editor.isActive('orderedList') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('taskList') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Task List"
            className={editor.isActive('taskList') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

        {/* Quote, Image, Link */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
            className={editor.isActive('blockquote') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Quote className="h-4 w-4" />
          </Button>

          {/* Image Upload Button */}
          {onImageUpload ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={triggerFileInput}
              title="Upload Image"
              disabled={isUploading}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin border-2 border-amber-400 border-t-transparent rounded-full" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={addImageFromUrl}
              title="Image (URL)"
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              <Image className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            variant={editor.isActive('link') ? 'default' : 'ghost'}
            size="icon"
            onClick={addLink}
            title="Link"
            className={editor.isActive('link') ? '' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 bg-slate-700" />

        {/* Clear Formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Clear Formatting"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};
