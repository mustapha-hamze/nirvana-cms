import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SelectField } from '../ui/FormField'
import CollapsibleSectionHeader from '../ui/CollapsibleSectionHeader'
import { SearchIcon } from '../icons'
import { getTitleForLang } from '../../utils/translations'
import { useLocale } from '../../i18n/useLocale'
import type { Category } from '../../types/category'
import type { Tag } from '../../types/tag'
import type { Author } from '../../types/author'
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
  authors,
  selectedAuthorId,
  onSelectAuthor,
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
  authors: Author[]
  selectedAuthorId: string
  onSelectAuthor: (id: string) => void
}) {
  const { t } = useLocale()
  return (
    <>
      <Separator />

      <div>
        <CollapsibleSectionHeader
          open={categoriesOpen}
          onToggle={onToggleCategories}
          label={t('nav.categories')}
          count={selectedCategoryIds.length}
        />
        {categoriesOpen && (
          <div className="mt-4">
            {categories.length === 0 ? (
              <p className="text-sm text-(--color-text-tertiary)">
                {t('builder.noCategoriesYet')}{' '}
                <Link to={`/applications/${applicationId}/categories`} className="text-primary underline">
                  {t('builder.createOne')}
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)">
                    <SearchIcon size={14} />
                  </span>
                  <Input
                    value={categorySearch}
                    onChange={(e) => onCategorySearchChange(e.target.value)}
                    placeholder={t('builder.searchCategories')}
                    className="ps-9"
                  />
                </div>
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-(--color-text-tertiary)">
                    {t('builder.noCategoriesMatch', { search: categorySearch })}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat._id)
                      return (
                        <Button
                          key={cat._id}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => onToggleCategory(cat._id)}
                        >
                          {categoryLabel(cat)}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <CollapsibleSectionHeader open={tagsOpen} onToggle={onToggleTags} label={t('nav.tags')} count={selectedTagIds.length} />
        {tagsOpen && (
          <div className="mt-4">
            {tags.length === 0 ? (
              <p className="text-sm text-(--color-text-tertiary)">
                {t('builder.noTagsYet')}{' '}
                <Link to={`/applications/${applicationId}/tags`} className="text-primary underline">
                  {t('builder.createOne')}
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)">
                    <SearchIcon size={14} />
                  </span>
                  <Input
                    value={tagSearch}
                    onChange={(e) => onTagSearchChange(e.target.value)}
                    placeholder={t('builder.searchTags')}
                    className="ps-9"
                  />
                </div>
                {filteredTags.length === 0 ? (
                  <p className="text-sm text-(--color-text-tertiary)">
                    {t('tags.noTagsMatch', { search: tagSearch })}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((tag) => {
                      const selected = selectedTagIds.includes(tag._id)
                      return (
                        <Button
                          key={tag._id}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => onToggleTag(tag._id)}
                        >
                          {getTitleForLang(tag.translations, activeLang)}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div>
        {authors.length === 0 ? (
          <p className="text-sm text-(--color-text-tertiary)">
            {t('builder.noAuthorsYet')}{' '}
            <Link to={`/applications/${applicationId}/authors`} className="text-primary underline">
              {t('builder.createOne')}
            </Link>
            .
          </p>
        ) : (
          <SelectField
            label={t('authors.selectAuthor')}
            value={selectedAuthorId}
            onChange={onSelectAuthor}
            options={[
              { value: '', label: t('authors.noneOption') },
              ...authors.map((a) => ({ value: a._id, label: a.displayName })),
            ]}
          />
        )}
      </div>
    </>
  )
}
