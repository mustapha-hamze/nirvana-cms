import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { api } from "../api/client";
import { theme } from "../theme";
import type { AdminOutletContext } from "../components/AdminLayout";
import {
  TrashIcon,
  PlusIcon,
  ChevronIcon,
  BackIcon,
  SearchIcon,
} from "../components/icons";
import {
  ErrorBanner,
  CancelButton,
  PrimaryButton,
} from "../components/ui/Modal";
import { TextField, TextAreaField } from "../components/ui/FormField";
import StatusToggle from "../components/ui/StatusToggle";
import ConfirmModal from "../components/ui/ConfirmModal";
import SkeletonTable from "../components/ui/SkeletonTable";
import KeywordsField from "../components/ui/KeywordsField";
import SectionCard from "../components/body/SectionCard";
import SectionTypePicker from "../components/body/SectionTypePicker";
import { useToast } from "../components/ui/useToast";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import { getTitleForLang } from "../utils/translations";
import type { Application } from "../types/application";
import type { Category } from "../types/category";
import type { Tag } from "../types/tag";
import {
  LANGUAGE_VALUES,
  LANGUAGE_LABELS,
  createEmptySection,
  withClientKeys,
  toPersistableSections,
  type LangKey,
  type ContentStatus,
  type ContentItem,
  type ContentDetail,
  type ContentMetadata,
  type ContentSection,
  type SectionType,
} from "../types/content";

type Draft = {
  title: string;
  headline: string;
  abstract: string;
  status: ContentStatus;
  metadata: ContentMetadata;
  sections: ContentSection[];
};

const EMPTY_METADATA: ContentMetadata = {
  keywords: [],
  author: "",
  description: "",
};
const EMPTY_DRAFT: Draft = {
  title: "",
  headline: "",
  abstract: "",
  status: "draft",
  metadata: EMPTY_METADATA,
  sections: [],
};

function buildInitialDrafts(
  content: ContentItem | null,
): Partial<Record<LangKey, Draft>> {
  const drafts: Partial<Record<LangKey, Draft>> = {};
  if (!content) return drafts;
  for (const d of content.details) {
    drafts[d.langKey] = {
      title: d.title,
      headline: d.headline,
      abstract: d.abstract,
      status: d.status,
      metadata: d.metadata,
      sections: withClientKeys(d.sections ?? []),
    };
  }
  return drafts;
}

export default function ContentForm() {
  const { app } = useOutletContext<AdminOutletContext>();
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();

  const [initialContent, setInitialContent] = useState<ContentItem | null>(
    null,
  );
  const [loading, setLoading] = useState(!!contentId);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    setLoadError(false);
    api
      .get<ContentItem>(`/content/${contentId}`)
      .then(setInitialContent)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [contentId]);

  if (!app || loading) {
    return (
      <div className="mx-10 my-10">
        <SkeletonTable />
      </div>
    );
  }

  if (contentId && loadError) {
    return (
      <div className="mx-10 my-10">
        <p style={{ color: theme.textSecondary }}>
          That content couldn't be found.{" "}
          <Link
            to={`/applications/${app._id}/contents`}
            className="underline"
            style={{ color: theme.accent }}
          >
            Back to Contents
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <ContentEditor
      app={app}
      content={contentId ? initialContent : null}
      onBack={() => navigate(`/applications/${app._id}/contents`)}
      onCreated={(created) =>
        navigate(`/applications/${app._id}/contents/${created._id}/edit`, {
          replace: true,
        })
      }
    />
  );
}

function ContentEditor({
  app,
  content,
  onBack,
  onCreated,
}: {
  app: Application;
  content: ContentItem | null;
  onBack: () => void;
  onCreated: (created: ContentItem) => void;
}) {
  const applicationId = app._id;
  const allowedLanguages = app.languages ?? LANGUAGE_VALUES;
  // Tracks the created/persisted content across saves — starts as the `content` prop
  // (null when creating) and is updated in place as saves succeed, so the page can
  // transition from "create" to "edit" in place once the parent navigates to the new URL.
  const [savedContent, setSavedContent] = useState<ContentItem | null>(content);
  const isEdit = savedContent !== null;
  const user = useAppSelector(selectUser);
  const canManage = isAppAdmin(user, applicationId);
  const [drafts, setDrafts] = useState<Partial<Record<LangKey, Draft>>>(() =>
    buildInitialDrafts(content),
  );
  const [activeLang, setActiveLang] = useState<LangKey | null>(
    content?.details[0]?.langKey ?? null,
  );
  const [removeLang, setRemoveLang] = useState<LangKey | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Categories/tags are shared across every language of this content (see Content
  // model), so they live outside the per-language tabs, not inside them.
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    (content?.categories ?? []).map((c) => c._id),
  );
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() =>
    (content?.tags ?? []).map((t) => t._id),
  );

  useEffect(() => {
    // Categories/tags are admin-only end to end — a ContentCreator can't read
    // these endpoints (403), so don't even ask. They're also only assignable
    // once the content exists, so skip the fetch entirely while creating.
    if (!canManage || !isEdit) return;
    api
      .get<Category[]>(`/categories?application=${applicationId}`)
      .then(setCategories)
      .catch(() => {});
    api
      .get<Tag[]>(`/tags?application=${applicationId}`)
      .then(setTags)
      .catch(() => {});
  }, [applicationId, canManage, isEdit]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Categories/tags are shared across languages, but their titles are not — show
  // each one in whichever language is currently being edited, falling back to
  // the standard preview order when this particular category/tag has no
  // translation for that language.
  function categoryLabel(cat: Category) {
    const parent = categories.find((c) => c._id === cat.parentId);
    const title = getTitleForLang(cat.translations, activeLang);
    return parent ? `${getTitleForLang(parent.translations, activeLang)} > ${title}` : title;
  }

  const filteredCategories = categories.filter((cat) =>
    categoryLabel(cat).toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );
  const filteredTags = tags.filter((tag) =>
    getTitleForLang(tag.translations, activeLang).toLowerCase().includes(tagSearch.trim().toLowerCase()),
  );

  const existingLangs = LANGUAGE_VALUES.filter((lang) => drafts[lang]);
  const availableLangs = allowedLanguages.filter((lang) => !drafts[lang]);
  const isPersisted = (lang: LangKey) =>
    savedContent?.details.some((d) => d.langKey === lang) ?? false;

  const draft = (activeLang && drafts[activeLang]) || EMPTY_DRAFT;

  function updateActiveDraft(patch: Partial<Draft>) {
    if (!activeLang) return;
    setDrafts((prev) => ({
      ...prev,
      [activeLang]: { ...(prev[activeLang] ?? EMPTY_DRAFT), ...patch },
    }));
  }

  function handleAddLanguage(lang: LangKey) {
    setDrafts((prev) => ({ ...prev, [lang]: { ...EMPTY_DRAFT } }));
    setActiveLang(lang);
  }

  function handleDiscardDraft(lang: LangKey) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[lang];
      return next;
    });
    setActiveLang(null);
  }

  function handleAddSection(type: SectionType) {
    updateActiveDraft({
      sections: [...draft.sections, createEmptySection(type)],
    });
  }

  function updateSectionAt(index: number, next: ContentSection) {
    const sections = draft.sections.slice();
    sections[index] = next;
    updateActiveDraft({ sections });
  }

  function removeSectionAt(index: number) {
    updateActiveDraft({
      sections: draft.sections.filter((_, i) => i !== index),
    });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = draft.sections.map((s) => s.cid!);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    updateActiveDraft({
      sections: arrayMove(draft.sections, oldIndex, newIndex),
    });
  }

  async function handleSave() {
    setError("");
    const entries = (Object.entries(drafts) as [LangKey, Draft][]).filter(
      ([, d]) => d.title.trim(),
    );
    if (entries.length === 0) {
      setError("At least one language needs a title");
      return;
    }
    setLoading(true);
    try {
      if (savedContent) {
        // Category/tag assignment is admin-only server-side — a ContentCreator
        // can't call this endpoint at all, so skip it entirely rather than send a
        // request that would 403 and fail the whole save.
        const [updatedContent, updatedDetails] = await Promise.all([
          canManage
            ? api.put<ContentItem>(`/content/${savedContent._id}`, {
                categories: selectedCategoryIds,
                tags: selectedTagIds,
              })
            : null,
          Promise.all(
            entries.map(([langKey, d]) =>
              api.put<ContentDetail>(
                `/content/${savedContent._id}/details/${langKey}`,
                { ...d, sections: toPersistableSections(d.sections) },
              ),
            ),
          ),
        ]);
        setSavedContent((prev) => {
          if (!prev) return prev;
          const byLang = new Map(prev.details.map((d) => [d.langKey, d]));
          for (const d of updatedDetails) byLang.set(d.langKey, d);
          return {
            ...prev,
            categories: updatedContent
              ? updatedContent.categories
              : prev.categories,
            tags: updatedContent ? updatedContent.tags : prev.tags,
            details: [...byLang.values()],
          };
        });
        showToast("Content has been updated");
      } else {
        const created = await api.post<ContentItem>("/content", {
          application: applicationId,
          categories: selectedCategoryIds,
          tags: selectedTagIds,
          details: entries.map(([langKey, d]) => ({
            langKey,
            ...d,
            sections: toPersistableSections(d.sections),
          })),
        });
        showToast("Content has been created");
        onCreated(created);
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEdit ? "save" : "create"} content`,
      );
    } finally {
      setLoading(false);
    }
  }

  const isRtl = activeLang === "fa";

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            title="Back to Contents"
            aria-label="Back to Contents"
            className="p-2 rounded-lg transition shrink-0"
            style={{ color: theme.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textPrimary;
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <BackIcon />
          </button>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              {isEdit ? "Edit Content" : "Create Content"}
            </h1>
            <p
              className="mt-1 text-[15px]"
              style={{ color: theme.textSecondary }}
            >
              {isEdit
                ? "Manage translations for this content"
                : "Add one or more languages, then create"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CancelButton onClick={onBack} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Content"}
          </PrimaryButton>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Language tabs */}
        <div
          className="flex items-center gap-1 px-6 pt-4"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          {existingLangs.map((lang) => {
            const active = lang === activeLang;
            const langDraft = drafts[lang];
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
                style={
                  active
                    ? {
                        color: theme.textPrimary,
                        borderBottom: "2px solid #7c3aed",
                      }
                    : {
                        color: theme.textSecondary,
                        borderBottom: "2px solid transparent",
                      }
                }
              >
                {langDraft && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        langDraft.status === "published"
                          ? theme.success
                          : "rgba(255,255,255,0.3)",
                    }}
                  />
                )}
                {LANGUAGE_LABELS[lang]}
              </button>
            );
          })}
          {availableLangs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveLang(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all -mb-px shrink-0"
              style={
                activeLang === null
                  ? {
                      color: theme.textPrimary,
                      borderBottom: "2px solid #7c3aed",
                    }
                  : {
                      color: theme.textSecondary,
                      borderBottom: "2px solid transparent",
                    }
              }
            >
              <PlusIcon size={14} />
              New Language
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {activeLang === null ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Select a language to add a translation for:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableLangs.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleAddLanguage(lang)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{
                      background: theme.inputBg,
                      border: `1px solid ${theme.inputBorder}`,
                      color: theme.textPrimary,
                    }}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <TextField
                label="Title"
                required
                value={draft.title}
                onChange={(v) => updateActiveDraft({ title: v })}
                dir={isRtl ? "rtl" : "ltr"}
              />
              <TextField
                label="Headline"
                value={draft.headline}
                onChange={(v) => updateActiveDraft({ headline: v })}
                dir={isRtl ? "rtl" : "ltr"}
              />
              <TextAreaField
                label="Abstract"
                value={draft.abstract}
                onChange={(v) => updateActiveDraft({ abstract: v })}
                dir={isRtl ? "rtl" : "ltr"}
              />

              {/* Body — dynamic content sections. Only meaningful once the
                  content exists, so it's hidden on the create form. */}
              {isEdit && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div>
                    <button
                      type="button"
                      onClick={() => setBodyOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = theme.textPrimary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = theme.textSecondary)
                      }
                    >
                      <ChevronIcon open={bodyOpen} size={14} />
                      Body
                      {draft.sections.length > 0 && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: theme.accentBg,
                            color: theme.accent,
                          }}
                        >
                          {draft.sections.length}
                        </span>
                      )}
                    </button>
                    {bodyOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-end">
                          <SectionTypePicker onPick={handleAddSection} />
                        </div>
                        {draft.sections.length === 0 ? (
                          <p
                            className="text-sm"
                            style={{ color: theme.textTertiary }}
                          >
                            No sections yet. Use "Add Section" to build this
                            page's body.
                          </p>
                        ) : (
                          <DndContext
                            sensors={sectionSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleSectionDragEnd}
                          >
                            <SortableContext
                              items={draft.sections.map((s) => s.cid!)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3">
                                {draft.sections.map((section, i) => (
                                  <SectionCard
                                    key={section.cid}
                                    id={section.cid!}
                                    applicationId={applicationId}
                                    section={section}
                                    onChange={(next) =>
                                      updateSectionAt(i, next)
                                    }
                                    onRemove={() => removeSectionAt(i)}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Categories/Tags — admin-only, shared across every language, and only
                  assignable once the content actually exists (not while creating). */}
              {isEdit && canManage && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div>
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = theme.textPrimary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = theme.textSecondary)
                      }
                    >
                      <ChevronIcon open={categoriesOpen} size={14} />
                      Categories
                      {selectedCategoryIds.length > 0 && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: theme.accentBg,
                            color: theme.accent,
                          }}
                        >
                          {selectedCategoryIds.length}
                        </span>
                      )}
                    </button>
                    {categoriesOpen && (
                      <div className="mt-4">
                        {categories.length === 0 ? (
                          <p
                            className="text-sm"
                            style={{ color: theme.textTertiary }}
                          >
                            No categories yet.{" "}
                            <Link
                              to={`/applications/${applicationId}/categories`}
                              className="underline"
                              style={{ color: theme.accent }}
                            >
                              Create one
                            </Link>
                            .
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <span
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: theme.textTertiary }}
                              >
                                <SearchIcon size={14} />
                              </span>
                              <input
                                value={categorySearch}
                                onChange={(e) =>
                                  setCategorySearch(e.target.value)
                                }
                                placeholder="Search categories…"
                                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
                                style={{
                                  background: theme.inputBg,
                                  border: `1px solid ${theme.inputBorder}`,
                                  color: theme.textPrimary,
                                }}
                              />
                            </div>
                            {filteredCategories.length === 0 ? (
                              <p
                                className="text-sm"
                                style={{ color: theme.textTertiary }}
                              >
                                No categories match "{categorySearch}".
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {filteredCategories.map((cat) => {
                                  const selected =
                                    selectedCategoryIds.includes(cat._id);
                                  return (
                                    <button
                                      key={cat._id}
                                      type="button"
                                      onClick={() => toggleCategory(cat._id)}
                                      className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                                      style={
                                        selected
                                          ? {
                                              background: theme.accentBg,
                                              border:
                                                "1px solid rgba(124,58,237,0.5)",
                                              color: theme.accent,
                                            }
                                          : {
                                              background: theme.inputBg,
                                              border: `1px solid ${theme.inputBorder}`,
                                              color: theme.textSecondary,
                                            }
                                      }
                                    >
                                      {categoryLabel(cat)}
                                    </button>
                                  );
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
                      onClick={() => setTagsOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = theme.textPrimary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = theme.textSecondary)
                      }
                    >
                      <ChevronIcon open={tagsOpen} size={14} />
                      Tags
                      {selectedTagIds.length > 0 && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: theme.accentBg,
                            color: theme.accent,
                          }}
                        >
                          {selectedTagIds.length}
                        </span>
                      )}
                    </button>
                    {tagsOpen && (
                      <div className="mt-4">
                        {tags.length === 0 ? (
                          <p
                            className="text-sm"
                            style={{ color: theme.textTertiary }}
                          >
                            No tags yet.{" "}
                            <Link
                              to={`/applications/${applicationId}/tags`}
                              className="underline"
                              style={{ color: theme.accent }}
                            >
                              Create one
                            </Link>
                            .
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <span
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: theme.textTertiary }}
                              >
                                <SearchIcon size={14} />
                              </span>
                              <input
                                value={tagSearch}
                                onChange={(e) => setTagSearch(e.target.value)}
                                placeholder="Search tags…"
                                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
                                style={{
                                  background: theme.inputBg,
                                  border: `1px solid ${theme.inputBorder}`,
                                  color: theme.textPrimary,
                                }}
                              />
                            </div>
                            {filteredTags.length === 0 ? (
                              <p
                                className="text-sm"
                                style={{ color: theme.textTertiary }}
                              >
                                No tags match "{tagSearch}".
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {filteredTags.map((tag) => {
                                  const selected = selectedTagIds.includes(
                                    tag._id,
                                  );
                                  return (
                                    <button
                                      key={tag._id}
                                      type="button"
                                      onClick={() => toggleTag(tag._id)}
                                      className="px-3.5 py-1.5 rounded-full text-sm font-medium transition"
                                      style={
                                        selected
                                          ? {
                                              background: theme.accentBg,
                                              border:
                                                "1px solid rgba(124,58,237,0.5)",
                                              color: theme.accent,
                                            }
                                          : {
                                              background: theme.inputBg,
                                              border: `1px solid ${theme.inputBorder}`,
                                              color: theme.textSecondary,
                                            }
                                      }
                                    >
                                      {getTitleForLang(tag.translations, activeLang)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SEO/byline — per language. Only meaningful once the content
                  exists, so it's hidden on the create form, same as Body above. */}
              {isEdit && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div>
                    <button
                      type="button"
                      onClick={() => setMetadataOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = theme.textPrimary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = theme.textSecondary)
                      }
                    >
                      <ChevronIcon open={metadataOpen} size={14} />
                      SEO &amp; Metadata
                    </button>
                    {metadataOpen && (
                      <div className="mt-4 space-y-4">
                        <TextField
                          label="Author"
                          value={draft.metadata.author}
                          onChange={(v) =>
                            updateActiveDraft({
                              metadata: { ...draft.metadata, author: v },
                            })
                          }
                          placeholder="e.g. Jane Doe"
                          dir={isRtl ? "rtl" : "ltr"}
                        />
                        <TextAreaField
                          label="Meta Description"
                          value={draft.metadata.description}
                          onChange={(v) =>
                            updateActiveDraft({
                              metadata: { ...draft.metadata, description: v },
                            })
                          }
                          placeholder="Shown in search engine results…"
                          dir={isRtl ? "rtl" : "ltr"}
                        />
                        <KeywordsField
                          value={draft.metadata.keywords}
                          onChange={(keywords) =>
                            updateActiveDraft({
                              metadata: { ...draft.metadata, keywords },
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div style={{ borderTop: `1px solid ${theme.border}` }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: theme.textSecondary }}
                    >
                      Content Status
                    </label>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <StatusToggle
                          checked={draft.status === "published"}
                          onToggle={() =>
                            updateActiveDraft({
                              status:
                                draft.status === "published"
                                  ? "draft"
                                  : "published",
                            })
                          }
                          onLabel="Publish"
                          offLabel="Unpublish"
                        />
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            draft.status === "published"
                              ? theme.success
                              : theme.textSecondary,
                        }}
                      >
                        {draft.status === "published" ? "Published" : "Draft"}
                        <small> (to change content publishing status)</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}` }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <PrimaryButton onClick={handleSave} disabled={loading}>
                    {loading
                      ? isEdit
                        ? "Saving…"
                        : "Creating…"
                      : isEdit
                        ? "Save Changes"
                        : "Create Content"}
                  </PrimaryButton>
                </div>

                {isPersisted(activeLang) ? (
                  canManage && (
                    <button
                      type="button"
                      onClick={() => setRemoveLang(activeLang)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.danger }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = theme.dangerHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = theme.danger)
                      }
                    >
                      <TrashIcon size={14} />
                      Remove {LANGUAGE_LABELS[activeLang]} translation
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDiscardDraft(activeLang)}
                    className="flex items-center gap-1.5 text-sm font-medium transition"
                    style={{ color: theme.textSecondary }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = theme.textPrimary)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = theme.textSecondary)
                    }
                  >
                    <TrashIcon size={14} />
                    Discard {LANGUAGE_LABELS[activeLang]} draft
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {removeLang && savedContent && (
        <ConfirmModal
          title={`Remove ${LANGUAGE_LABELS[removeLang]} translation?`}
          message="This translation will be removed from this content. This action cannot be undone."
          confirmLabel="Remove Translation"
          loadingLabel="Removing…"
          onConfirm={async () => {
            await api.delete(
              `/content/${savedContent._id}/details/${removeLang}`,
            );
            setDrafts((prev) => {
              const next = { ...prev };
              delete next[removeLang];
              return next;
            });
            setSavedContent(
              (prev) =>
                prev && {
                  ...prev,
                  details: prev.details.filter((d) => d.langKey !== removeLang),
                },
            );
            setActiveLang(null);
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </div>
  );
}
