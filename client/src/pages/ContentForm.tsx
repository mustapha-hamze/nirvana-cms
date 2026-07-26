import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { BackIcon } from "../components/icons";
import { ErrorBanner, CancelButton, PrimaryButton } from "../components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusToggle from "../components/ui/StatusToggle";
import SkeletonTable from "../components/ui/SkeletonTable";
import TranslationTabs from "../components/ui/TranslationTabs";
import TranslationPicker from "../components/ui/TranslationPicker";
import TranslationRemoveConfirm from "../components/ui/TranslationRemoveConfirm";
import TranslationActions from "../components/ui/TranslationActions";
import SeoMetadataPanel from "../components/ui/SeoMetadataPanel";
import ContentMainFields from "../components/contentEditor/ContentMainFields";
import ContentBodySection from "../components/contentEditor/ContentBodySection";
import ContentTaxonomyPanel from "../components/contentEditor/ContentTaxonomyPanel";
import { useContentDrafts } from "../hooks/useContentDrafts";
import { useContentSave } from "../hooks/useContentSave";
import { useContentTaxonomy } from "../hooks/useContentTaxonomy";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import type { Application } from "../types/application";
import { LANGUAGE_VALUES, type LangKey, type ContentItem } from "../types/content";

export default function ContentForm() {
  const { app } = useOutletContext<AdminOutletContext>();
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();

  const [initialContent, setInitialContent] = useState<ContentItem | null>(null);
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
        <p className="text-muted-foreground">
          That content couldn't be found.{" "}
          <Link
            to={`/applications/${app._id}/contents`}
            className="text-primary underline"
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
  const user = useAppSelector(selectUser);
  const canManage = isAppAdmin(user, applicationId);

  const {
    drafts, activeLang, setActiveLang, existingLangs, availableLangs, draft, isPersisted,
    updateActiveDraft, handleAddLanguage, handleDiscardDraft,
    handleAddSection, updateSectionAt, removeSectionAt, reorderSections,
  } = useContentDrafts({
    content,
    allowedLanguages,
    persistedLangs: savedContent?.details.map((d) => d.langKey) ?? [],
  });

  const isEdit = savedContent !== null;
  const taxonomy = useContentTaxonomy({ applicationId, canManage, isEdit, activeLang, content });

  const { loading, error, handleSave } = useContentSave({
    applicationId,
    canManage,
    savedContent,
    setSavedContent,
    selectedCategoryIds: taxonomy.selectedCategoryIds,
    selectedTagIds: taxonomy.selectedTagIds,
    onCreated,
  });

  const [removeLang, setRemoveLang] = useState<LangKey | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const isRtl = activeLang === "fa";

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            title="Back to Contents"
            aria-label="Back to Contents"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <BackIcon />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? "Edit Content" : "Create Content"}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {isEdit ? "Manage translations for this content" : "Add one or more languages, then create"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CancelButton onClick={onBack} disabled={loading} />
          <PrimaryButton onClick={() => handleSave(drafts)} disabled={loading}>
            {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Content"}
          </PrimaryButton>
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border bg-card">
        <TranslationTabs
          existingLangs={existingLangs}
          availableLangs={availableLangs}
          activeLang={activeLang}
          drafts={drafts}
          onSelect={setActiveLang}
        />

        <div className="px-6 py-5 space-y-4">
          {activeLang === null ? (
            <TranslationPicker availableLangs={availableLangs} onPick={handleAddLanguage} />
          ) : (
            <>
              <ContentMainFields
                title={draft.title}
                headline={draft.headline}
                abstract={draft.abstract}
                onChangeTitle={(v) => updateActiveDraft({ title: v })}
                onChangeHeadline={(v) => updateActiveDraft({ headline: v })}
                onChangeAbstract={(v) => updateActiveDraft({ abstract: v })}
                isRtl={isRtl}
              />

              {isEdit && (
                <ContentBodySection
                  applicationId={applicationId}
                  open={bodyOpen}
                  onToggle={() => setBodyOpen((v) => !v)}
                  sections={draft.sections}
                  onAddSection={handleAddSection}
                  onChangeSection={updateSectionAt}
                  onRemoveSection={removeSectionAt}
                  onReorder={reorderSections}
                />
              )}

              {isEdit && canManage && (
                <ContentTaxonomyPanel
                  applicationId={applicationId}
                  activeLang={activeLang}
                  categoriesOpen={categoriesOpen}
                  onToggleCategories={() => setCategoriesOpen((v) => !v)}
                  categories={taxonomy.categories}
                  filteredCategories={taxonomy.filteredCategories}
                  categoryLabel={taxonomy.categoryLabel}
                  categorySearch={taxonomy.categorySearch}
                  onCategorySearchChange={taxonomy.setCategorySearch}
                  selectedCategoryIds={taxonomy.selectedCategoryIds}
                  onToggleCategory={taxonomy.toggleCategory}
                  tagsOpen={tagsOpen}
                  onToggleTags={() => setTagsOpen((v) => !v)}
                  tags={taxonomy.tags}
                  filteredTags={taxonomy.filteredTags}
                  tagSearch={taxonomy.tagSearch}
                  onTagSearchChange={taxonomy.setTagSearch}
                  selectedTagIds={taxonomy.selectedTagIds}
                  onToggleTag={taxonomy.toggleTag}
                />
              )}

              {isEdit && (
                <SeoMetadataPanel
                  open={metadataOpen}
                  onToggle={() => setMetadataOpen((v) => !v)}
                  metadata={draft.metadata}
                  onChange={(patch) => updateActiveDraft({ metadata: { ...draft.metadata, ...patch } })}
                  isRtl={isRtl}
                />
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                      Content Status
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
                      <span className={`text-sm font-medium ${draft.status === "published" ? "text-(--color-success)" : "text-muted-foreground"}`}>
                        {draft.status === "published" ? "Published" : "Draft"}
                        <small> (to change content publishing status)</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <TranslationActions
                loading={loading}
                saveLabel={loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Content"}
                onSave={() => handleSave(drafts)}
                activeLang={activeLang}
                isPersisted={isPersisted(activeLang)}
                canManage={canManage}
                onRemove={() => setRemoveLang(activeLang)}
                onDiscard={() => handleDiscardDraft(activeLang)}
              />
            </>
          )}
        </div>
      </div>

      {removeLang && savedContent && (
        <TranslationRemoveConfirm
          lang={removeLang}
          itemLabel="content"
          onConfirm={async () => {
            await api.delete(`/content/${savedContent._id}/details/${removeLang}`);
            handleDiscardDraft(removeLang);
            setSavedContent(
              (prev) => prev && { ...prev, details: prev.details.filter((d) => d.langKey !== removeLang) },
            );
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </div>
  );
}
