import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { ReactNode } from 'react'
import { theme } from '../../theme'
import type { RichTextElement } from '../../types/content'

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
      style={active ? { background: theme.accentBg, color: theme.accent } : { color: theme.textSecondary }}
    >
      {children}
    </button>
  )
}

// Curated toolbar (bold/italic/headings/lists/link only) so the stored HTML
// stays predictable for a future public-facing renderer — no kitchen-sink
// formatting options.
export default function RichTextElementEditor({
  element,
  onChange,
}: {
  element: RichTextElement
  onChange: (next: RichTextElement) => void
}) {
  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false })],
      content: element.html,
      onUpdate: ({ editor }) => onChange({ ...element, html: editor.getHTML() }),
    },
    [],
  )

  if (!editor) return null

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        Rich Text
      </label>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
        <div
          className="flex items-center gap-1 px-2 py-1.5"
          style={{ borderBottom: `1px solid ${theme.border}`, background: theme.inputBg }}
        >
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
        <EditorContent editor={editor} className="px-4 py-2.5 text-sm" style={{ color: theme.textPrimary, minHeight: '120px' }} />
      </div>
    </div>
  )
}
