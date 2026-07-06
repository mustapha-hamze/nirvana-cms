import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
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
import { TrashIcon, PlusIcon, ChevronIcon, BackIcon } from "../components/icons";
import { ErrorBanner, CancelButton, PrimaryButton } from "../components/ui/Modal";
import { TextField, TextAreaField } from "../components/ui/FormField";
import StatusToggle from "../components/ui/StatusToggle";
import ConfirmModal from "../components/ui/ConfirmModal";
import SkeletonTable from "../components/ui/SkeletonTable";
import KeywordsField from "../components/ui/KeywordsField";
import PageSectionCard from "../components/pageBody/PageSectionCard";
import PageSectionTypePicker from "../components/pageBody/PageSectionTypePicker";
import { useToast } from "../components/ui/useToast";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import type { Application } from "../types/application";
import {
  LANGUAGE_VALUES,
  LANGUAGE_LABELS,
  type LangKey,
} from "../types/content";
import {
  createEmptySection,
  withClientKeys,
  toPersistableSections,
  type PageStatus,
  type PageItem,
  type PageDetail,
  type PageMetadata,
  type PageSection,
  type PageSectionType,
} from "../types/page";

type Draft = {
  title: string;
  status: PageStatus;
  metadata: PageMetadata;
  sections: PageSection[];
};

const EMPTY_METADATA: PageMetadata = { keywords: [], author: "", description: "" };
const EMPTY_DRAFT: Draft = { title: "", status: "draft", metadata: EMPTY_METADATA, sections: [] };

function buildInitialDrafts(page: PageItem | null): Partial<Record<LangKey, Draft>> {
  const drafts: Partial<Record<LangKey, Draft>> = {};
  if (!page) return drafts;
  for (const d of page.details) {
    drafts[d.langKey] = {
      title: d.title,
      status: d.status,
      metadata: d.metadata,
      sections: withClientKeys(d.sections ?? []),
    };
  }
  return drafts;
}

export default function PageForm() {
  const { app } = useOutletContext<AdminOutletContext>();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  const [initialPage, setInitialPage] = useState<PageItem | null>(null);
  const [loading, setLoading] = useState(!!pageId);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    setLoading(true);
    setLoadError(false);
    api
      .get<PageItem>(`/pages/${pageId}`)
      .then(setInitialPage)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [pageId]);

  if (!app || loading) {
    return (
      <div className="mx-10 my-10">
        <SkeletonTable />
      </div>
    );
  }

  if (pageId && loadError) {
    return (
      <div className="mx-10 my-10">
        <p style={{ color: theme.textSecondary }}>
          That page couldn't be found.{" "}
          <Link to={`/applications/${app._id}/pages`} className="underline" style={{ color: theme.accent }}>
            Back to Pages
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <PageEditor
      app={app}
      page={pageId ? initialPage : null}
      onBack={() => navigate(`/applications/${app._id}/pages`)}
      onCreated={(created) =>
        navigate(`/applications/${app._id}/pages/${created._id}/edit`, { replace: true })
      }
    />
  );
}

function PageEditor({
  app,
  page,
  onBack,
  onCreated,
}: {
  app: Application;
  page: PageItem | null;
  onBack: () => void;
  onCreated: (created: PageItem) => void;
}) {
  const applicationId = app._id;
  const allowedLanguages = app.languages ?? LANGUAGE_VALUES;
  // Tracks the created/persisted page across saves — starts as the `page` prop
  // (null when creating) and is updated in place as saves succeed, so the page
  // can transition from "create" to "edit" in place once the parent navigates
  // to the new URL. Same convention as ContentForm's savedContent.
  const [savedPage, setSavedPage] = useState<PageItem | null>(page);
  const isEdit = savedPage !== null;
  const user = useAppSelector(selectUser);
  const canManage = isAppAdmin(user, applicationId);
  const [drafts, setDrafts] = useState<Partial<Record<LangKey, Draft>>>(() => buildInitialDrafts(page));
  const [activeLang, setActiveLang] = useState<LangKey | null>(page?.details[0]?.langKey ?? null);
  const [removeLang, setRemoveLang] = useState<LangKey | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  // Unlike ContentForm's Body (collapsed by default — Content has other primary
  // fields ahead of it), Sections ARE the page: default open so editing starts
  // immediately without an extra click.
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const sectionSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [isHomepage, setIsHomepage] = useState(page?.isHomepage ?? false);

  const existingLangs = LANGUAGE_VALUES.filter((lang) => drafts[lang]);
  const availableLangs = allowedLanguages.filter((lang) => !drafts[lang]);
  const isPersisted = (lang: LangKey) => savedPage?.details.some((d) => d.langKey === lang) ?? false;

  const draft = (activeLang && drafts[activeLang]) || EMPTY_DRAFT;

  function updateActiveDraft(patch: Partial<Draft>) {
    if (!activeLang) return;
    setDrafts((prev) => ({ ...prev, [activeLang]: { ...(prev[activeLang] ?? EMPTY_DRAFT), ...patch } }));
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

  function handleAddSection(type: PageSectionType) {
    updateActiveDraft({ sections: [...draft.sections, createEmptySection(type)] });
  }

  function updateSectionAt(index: number, next: PageSection) {
    const sections = draft.sections.slice();
    sections[index] = next;
    updateActiveDraft({ sections });
  }

  function removeSectionAt(index: number) {
    updateActiveDraft({ sections: draft.sections.filter((_, i) => i !== index) });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = draft.sections.map((s) => s.cid!);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    updateActiveDraft({ sections: arrayMove(draft.sections, oldIndex, newIndex) });
  }

  async function handleSave() {
    setError("");
    const entries = (Object.entries(drafts) as [LangKey, Draft][]).filter(([, d]) => d.title.trim());
    if (entries.length === 0) {
      setError("At least one language needs a title");
      return;
    }
    setLoading(true);
    try {
      if (savedPage) {
        // isHomepage is admin-only server-side — a plain staff member can't call
        // this endpoint at all, so skip it entirely rather than send a request
        // that would 403 and fail the whole save.
        const [updatedPage, updatedDetails] = await Promise.all([
          canManage && isHomepage !== savedPage.isHomepage
            ? api.put<PageItem>(`/pages/${savedPage._id}`, { isHomepage })
            : null,
          Promise.all(
            entries.map(([langKey, d]) =>
              api.put<PageDetail>(`/pages/${savedPage._id}/details/${langKey}`, {
                ...d,
                sections: toPersistableSections(d.sections),
              }),
            ),
          ),
        ]);
        setSavedPage((prev) => {
          if (!prev) return prev;
          const byLang = new Map(prev.details.map((d) => [d.langKey, d]));
          for (const d of updatedDetails) byLang.set(d.langKey, d);
          return {
            ...prev,
            isHomepage: updatedPage ? updatedPage.isHomepage : prev.isHomepage,
            details: [...byLang.values()],
          };
        });
        showToast("Page has been updated");
      } else {
        const created = await api.post<PageItem>("/pages", {
          application: applicationId,
          isHomepage,
          details: entries.map(([langKey, d]) => ({
            langKey,
            ...d,
            sections: toPersistableSections(d.sections),
          })),
        });
        showToast("Page has been created");
        onCreated(created);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? "save" : "create"} page`);
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
            title="Back to Pages"
            aria-label="Back to Pages"
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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
              {isEdit ? "Edit Page" : "Create Page"}
            </h1>
            <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
              {isEdit ? "Manage translations for this page" : "Add one or more languages, then create"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CancelButton onClick={onBack} disabled={loading} />
          <PrimaryButton onClick={handleSave} disabled={loading}>
            {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Page"}
          </PrimaryButton>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
        {/* Language tabs */}
        <div className="flex items-center gap-1 px-6 pt-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
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
                    ? { color: theme.textPrimary, borderBottom: "2px solid #7c3aed" }
                    : { color: theme.textSecondary, borderBottom: "2px solid transparent" }
                }
              >
                {langDraft && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: langDraft.status === "published" ? theme.success : "rgba(255,255,255,0.3)" }}
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
                  ? { color: theme.textPrimary, borderBottom: "2px solid #7c3aed" }
                  : { color: theme.textSecondary, borderBottom: "2px solid transparent" }
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
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }}
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
                placeholder="e.g. About Us"
                dir={isRtl ? "rtl" : "ltr"}
              />

              {/* Sections — the page's actual visual content. Only meaningful
                  once the page exists, so hidden on the create form, same as
                  ContentForm hides Body until a content item exists. */}
              {isEdit && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div>
                    <button
                      type="button"
                      onClick={() => setSectionsOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                    >
                      <ChevronIcon open={sectionsOpen} size={14} />
                      Sections
                      {draft.sections.length > 0 && (
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: theme.accentBg, color: theme.accent }}
                        >
                          {draft.sections.length}
                        </span>
                      )}
                    </button>
                    {sectionsOpen && (
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-end">
                          <PageSectionTypePicker onPick={handleAddSection} />
                        </div>
                        {draft.sections.length === 0 ? (
                          <p className="text-sm" style={{ color: theme.textTertiary }}>
                            No sections yet. Use "Add Section" to build this page.
                          </p>
                        ) : (
                          <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                            <SortableContext items={draft.sections.map((s) => s.cid!)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-3">
                                {draft.sections.map((section, i) => (
                                  <PageSectionCard
                                    key={section.cid}
                                    id={section.cid!}
                                    applicationId={applicationId}
                                    section={section}
                                    onChange={(next) => updateSectionAt(i, next)}
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

              {/* Homepage — admin-only, shared across every language (a page's
                  identity doesn't change per language), and only meaningful
                  once the page exists. */}
              {isEdit && canManage && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
                        Homepage
                      </label>
                      <div className="flex items-center gap-2">
                        <StatusToggle
                          checked={isHomepage}
                          onToggle={() => setIsHomepage((v) => !v)}
                          onLabel="Set as homepage"
                          offLabel="Unset as homepage"
                        />
                        <span className="text-sm font-medium" style={{ color: theme.textSecondary }}>
                          {isHomepage ? "This is the site's homepage" : "Not the homepage"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SEO/byline — per language. Only meaningful once the page
                  exists, so it's hidden on the create form, same as Sections above. */}
              {isEdit && (
                <>
                  <div style={{ borderTop: `1px solid ${theme.border}` }} />

                  <div>
                    <button
                      type="button"
                      onClick={() => setMetadataOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.textSecondary }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                    >
                      <ChevronIcon open={metadataOpen} size={14} />
                      SEO &amp; Metadata
                    </button>
                    {metadataOpen && (
                      <div className="mt-4 space-y-4">
                        <TextField
                          label="Author"
                          value={draft.metadata.author}
                          onChange={(v) => updateActiveDraft({ metadata: { ...draft.metadata, author: v } })}
                          placeholder="e.g. Jane Doe"
                          dir={isRtl ? "rtl" : "ltr"}
                        />
                        <TextAreaField
                          label="Meta Description"
                          value={draft.metadata.description}
                          onChange={(v) => updateActiveDraft({ metadata: { ...draft.metadata, description: v } })}
                          placeholder="Shown in search engine results…"
                          dir={isRtl ? "rtl" : "ltr"}
                        />
                        <KeywordsField
                          value={draft.metadata.keywords}
                          onChange={(keywords) => updateActiveDraft({ metadata: { ...draft.metadata, keywords } })}
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
                    <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
                      Page Status
                    </label>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <StatusToggle
                          checked={draft.status === "published"}
                          onToggle={() =>
                            updateActiveDraft({ status: draft.status === "published" ? "draft" : "published" })
                          }
                          onLabel="Publish"
                          offLabel="Unpublish"
                        />
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{ color: draft.status === "published" ? theme.success : theme.textSecondary }}
                      >
                        {draft.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}` }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <PrimaryButton onClick={handleSave} disabled={loading}>
                    {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Page"}
                  </PrimaryButton>
                </div>

                {isPersisted(activeLang) ? (
                  canManage && (
                    <button
                      type="button"
                      onClick={() => setRemoveLang(activeLang)}
                      className="flex items-center gap-1.5 text-sm font-medium transition"
                      style={{ color: theme.danger }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = theme.dangerHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.danger)}
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
                    onMouseEnter={(e) => (e.currentTarget.style.color = theme.textPrimary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
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

      {removeLang && savedPage && (
        <ConfirmModal
          title={`Remove ${LANGUAGE_LABELS[removeLang]} translation?`}
          message="This translation will be removed from this page. This action cannot be undone."
          confirmLabel="Remove Translation"
          loadingLabel="Removing…"
          onConfirm={async () => {
            await api.delete(`/pages/${savedPage._id}/details/${removeLang}`);
            setDrafts((prev) => {
              const next = { ...prev };
              delete next[removeLang];
              return next;
            });
            setSavedPage(
              (prev) => prev && { ...prev, details: prev.details.filter((d) => d.langKey !== removeLang) },
            );
            setActiveLang(null);
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </div>
  );
}
