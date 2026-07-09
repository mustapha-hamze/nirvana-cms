import { Link } from 'react-router-dom'
import { theme } from '../../theme'
import { ChevronIcon, SearchIcon } from '../icons'
import { getTitleForLang } from '../../utils/translations'
import type { Category } from '../../types/category'
import type { Tag } from '../../types/tag'
import type { LangKey } from '../../types/content'

// Categories/Tags — admin-only, shared across every language of a content
// item, and only assignable once the content actually exists (not while
// creating). Two near-identical collapsible pill pickers, kept as one
// component since they share every interaction (search, toggle, empty states).
export default function ContentTaxonomyPanel({
  applicationId,
  activeLang,
  categoriesOpen,
  onToggleCategories,
  categories,
  filteredCategories,
  categoryLabel,
  categorySearch,
  onCategorySearchChange,
  selectedCategoryIds,
  onToggleCategory,
  tagsOpen,
  onToggleTags,
  tags,
  filteredTags,
  tagSearch,
  onTagSearchChange,
  selectedTagIds,
  onToggleTag,
}: {
  applicationId: string
  activeLang: LangKey | null
  categoriesOpen: boolean
  onToggleCategories: () => void
  categories: Category[]
  filteredCategories: Category[]
  categoryLabel: (cat: Category) => string
  categorySearch: string
  onCategorySearchChange: (value: string) => void
  selectedCategoryIds: string[]
  onToggleCategory: (id: string) => void
  tagsOpen: boolean
  onToggleTags: () => void
  tags: Tag[]
  filteredTags: Tag[]
  tagSearch: string
  onTagSearchChange: (value: string) => void
  selectedTagIds: string[]
  onToggleTag: (id: string) => void
}) {
  return (
    <>
      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div>
        <button
          type="button"
          onClick={onToggleCategories}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronIcon open={categoriesOpen} size={14} />
          Categories
          {selectedCategoryIds.length > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: theme.accentBg, color: theme.accent }}
            >
              {selectedCategoryIds.length}
            </span>
          )}
        </button>
        {categoriesOpen && (
          <div className="mt-4">
            {categories.length === 0 ? (
              <p className="text-sm" style={{ color: theme.textTertiary }}>
                No categories yet.{' '}
                <Link to={`/applications/${applicationId}/categories`} className="underline" style={{ color: theme.accent }}>
                  Create one
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textTertiary }}>
                    <SearchIcon size={14} />
                  </span>
                  <input
                    value={categorySearch}
                    onChange={(e) => onCategorySearchChange(e.target.value)}
                    placeholder="Search categories…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                  />
                </div>
                {filteredCategories.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.textTertiary }}>
                    No categories match "{categorySearch}".
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat._id)
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => onToggleCategory(cat._id)}
                          className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                          style={selected
                            ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
                            : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
                          }
                        >
                          {categoryLabel(cat)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}` }} />

      <div>
        <button
          type="button"
          onClick={onToggleTags}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
        >
          <ChevronIcon open={tagsOpen} size={14} />
          Tags
          {selectedTagIds.length > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: theme.accentBg, color: theme.accent }}
            >
              {selectedTagIds.length}
            </span>
          )}
        </button>
        {tagsOpen && (
          <div className="mt-4">
            {tags.length === 0 ? (
              <p className="text-sm" style={{ color: theme.textTertiary }}>
                No tags yet.{' '}
                <Link to={`/applications/${applicationId}/tags`} className="underline" style={{ color: theme.accent }}>
                  Create one
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textTertiary }}>
                    <SearchIcon size={14} />
                  </span>
                  <input
                    value={tagSearch}
                    onChange={(e) => onTagSearchChange(e.target.value)}
                    placeholder="Search tags…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
                  />
                </div>
                {filteredTags.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.textTertiary }}>
                    No tags match "{tagSearch}".
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((tag) => {
                      const selected = selectedTagIds.includes(tag._id)
                      return (
                        <button
                          key={tag._id}
                          type="button"
                          onClick={() => onToggleTag(tag._id)}
                          className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                          style={selected
                            ? { background: theme.accentBg, border: '1px solid rgba(124,58,237,0.5)', color: theme.accent }
                            : { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textSecondary }
                          }
                        >
                          {getTitleForLang(tag.translations, activeLang)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
