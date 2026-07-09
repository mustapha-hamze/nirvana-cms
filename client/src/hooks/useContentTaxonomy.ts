import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { getTitleForLang } from '../utils/translations'
import type { Category } from '../types/category'
import type { Tag } from '../types/tag'
import type { PaginatedResult } from '../types/pagination'
import type { ContentItem, LangKey } from '../types/content'

// Categories/tags are shared across every language of a content item (unlike
// its per-language title/body), admin-only end to end, and only assignable
// once the content actually exists — so this hook only fetches once editing
// an already-persisted item as an admin.
export function useContentTaxonomy({
  applicationId,
  canManage,
  isEdit,
  activeLang,
  content,
}: {
  applicationId: string
  canManage: boolean
  isEdit: boolean
  activeLang: LangKey | null
  content: ContentItem | null
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    (content?.categories ?? []).map((c) => c._id),
  )
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() =>
    (content?.tags ?? []).map((t) => t._id),
  )
  const [categorySearch, setCategorySearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')

  useEffect(() => {
    if (!canManage || !isEdit) return
    api
      .get<Category[]>(`/categories?application=${applicationId}`)
      .then(setCategories)
      .catch(() => {})
    api
      .get<PaginatedResult<Tag>>(`/tags?application=${applicationId}&limit=100`)
      .then((res) => setTags(res.items))
      .catch(() => {})
  }, [applicationId, canManage, isEdit])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // Categories/tags are shared across languages, but their titles are not — show
  // each one in whichever language is currently being edited, falling back to
  // the standard preview order when this particular category/tag has no
  // translation for that language.
  function categoryLabel(cat: Category) {
    const parent = categories.find((c) => c._id === cat.parentId)
    const title = getTitleForLang(cat.translations, activeLang)
    return parent ? `${getTitleForLang(parent.translations, activeLang)} > ${title}` : title
  }

  const filteredCategories = categories.filter((cat) =>
    categoryLabel(cat).toLowerCase().includes(categorySearch.trim().toLowerCase()),
  )
  const filteredTags = tags.filter((tag) =>
    getTitleForLang(tag.translations, activeLang).toLowerCase().includes(tagSearch.trim().toLowerCase()),
  )

  return {
    categories,
    tags,
    selectedCategoryIds,
    selectedTagIds,
    categorySearch,
    setCategorySearch,
    tagSearch,
    setTagSearch,
    toggleCategory,
    toggleTag,
    categoryLabel,
    filteredCategories,
    filteredTags,
  }
}
