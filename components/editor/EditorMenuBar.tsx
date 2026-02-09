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
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EditorMenuBarProps {
  editor: Editor | null;
}

export const EditorMenuBar = ({ editor }: EditorMenuBarProps) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
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
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-white p-2 dark:bg-gray-800">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
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
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('taskList') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Quote, Image, Link */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={addImage}
          title="Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="icon"
          onClick={addLink}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Clear Formatting */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
