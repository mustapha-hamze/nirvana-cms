import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { RichTextElement } from '../../types/content'
import { getTextDirection } from '../../utils/rtl'
import { useLocale } from '../../i18n/useLocale'

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
  const { t } = useLocale()
  // Detection runs directly against the raw HTML on mount (tags/attributes
  // are pure ASCII, so they can never falsely match RTL script) and against
  // the editor's plain text on every update thereafter — never mutates the
  // saved HTML, only the wrapper's own `dir`/font for display.
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => getTextDirection(element.html))

  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false })],
      content: element.html,
      onUpdate: ({ editor }) => {
        onChange({ ...element, html: editor.getHTML() })
        setDirection(getTextDirection(editor.getText()))
      },
    },
    [],
  )

  if (!editor) return null

  return (
    <div>
      <Label className="mb-1.5 text-sm font-medium text-muted-foreground">
        {t('contentBuilder.elementRichText')}
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
            • {t('contentBuilder.list')}
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. {t('contentBuilder.list')}
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={() => {
              const url = window.prompt(t('contentBuilder.linkUrl'))
              if (url) editor.chain().focus().setLink({ href: url }).run()
              else editor.chain().focus().unsetLink().run()
            }}
          >
            {t('contentBuilder.elementLink')}
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          dir={direction}
          className={cn('min-h-[120px] px-4 py-2.5 text-sm text-foreground', direction === 'rtl' && 'rtl-text')}
        />
      </div>
    </div>
  )
}
