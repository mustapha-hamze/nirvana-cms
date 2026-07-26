import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-auto px-2.5 py-1.5 text-xs font-semibold"
    >
      {children}
    </Button>
  )
}

// Low-level rich text editor (TipTap), factored out of body/RichTextElementEditor
// so page sections that need "a block of formatted HTML" in more than one
// place (the Text section itself, plus each Tab/Accordion item's body) share
// one editor implementation instead of three copies of the same toolbar.
// Same curated toolbar (bold/italic/headings/lists/link only) so stored HTML
// stays predictable for a future public-facing renderer.
export default function RichTextArea({
  label,
  html,
  onChange,
}: {
  label: string
  html: string
  onChange: (html: string) => void
}) {
  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false })],
      content: html,
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    },
    [],
  )

  if (!editor) return null

  return (
    <div>
      <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="rounded-xl overflow-hidden border">
        <div className="flex items-center gap-1 border-b bg-input/30 px-2 py-1.5">
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            B
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={() => {
              const url = window.prompt('Link URL')
              if (url) editor.chain().focus().setLink({ href: url }).run()
              else editor.chain().focus().unsetLink().run()
            }}
          >
            Link
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} className="min-h-[100px] px-4 py-2.5 text-sm text-foreground" />
      </div>
    </div>
  )
}
