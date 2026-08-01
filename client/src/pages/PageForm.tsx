import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { api, generatePageTranslation } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { BackIcon } from "../components/icons";
import { ErrorBanner, CancelButton, PrimaryButton } from "../components/ui/Modal";
import { TextField } from "../components/ui/FormField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusToggle from "../components/ui/StatusToggle";
import SkeletonTable from "../components/ui/SkeletonTable";
import TranslationTabs from "../components/ui/TranslationTabs";
import TranslationPicker from "../components/ui/TranslationPicker";
import TranslationRemoveConfirm from "../components/ui/TranslationRemoveConfirm";
import TranslationActions from "../components/ui/TranslationActions";
import SeoMetadataPanel from "../components/ui/SeoMetadataPanel";
import PageSectionsPanel from "../components/pageEditor/PageSectionsPanel";
import HomepagePanel from "../components/pageEditor/HomepagePanel";
import { usePageDrafts } from "../hooks/usePageDrafts";
import { usePageSave } from "../hooks/usePageSave";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import type { Application } from "../types/application";
import { LANGUAGE_VALUES, type LangKey } from "../types/content";
import type { PageItem } from "../types/page";

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
        <p className="text-muted-foreground">
          That page couldn't be found.{" "}
          <Link to={`/applications/${app._id}/pages`} className="text-primary underline">
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
  const user = useAppSelector(selectUser);
  const canManage = isAppAdmin(user, applicationId);

  const {
    drafts, activeLang, setActiveLang, existingLangs, availableLangs, draft, isPersisted,
    updateActiveDraft, handleAddLanguage, handleDiscardDraft,
    handleAddSection, updateSectionAt, removeSectionAt, reorderSections, handleGenerateTranslation,
  } = usePageDrafts({
    page,
    allowedLanguages,
    persistedLangs: savedPage?.details.map((d) => d.langKey) ?? [],
  });

  const [removeLang, setRemoveLang] = useState<LangKey | null>(null);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [isHomepage, setIsHomepage] = useState(page?.isHomepage ?? false);

  const { loading, error, handleSave, isEdit } = usePageSave({
    applicationId,
    canManage,
    savedPage,
    setSavedPage,
    isHomepage,
    onCreated,
  });

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
            title="Back to Pages"
            aria-label="Back to Pages"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <BackIcon />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEdit ? "Edit Page" : "Create Page"}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {isEdit ? "Manage translations for this page" : "Add one or more languages, then create"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CancelButton onClick={onBack} disabled={loading} />
          <PrimaryButton onClick={() => handleSave(drafts)} disabled={loading}>
            {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Page"}
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
            <TranslationPicker
              availableLangs={availableLangs}
              onPick={handleAddLanguage}
              aiGenerate={
                savedPage
                  ? {
                      sourceLangKeys: savedPage.details.map((d) => d.langKey),
                      onGenerate: (target, source) => generatePageTranslation(savedPage._id, source, target),
                    }
                  : undefined
              }
              onGenerated={handleGenerateTranslation}
            />
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

              {isEdit && (
                <PageSectionsPanel
                  applicationId={applicationId}
                  sections={draft.sections}
                  onAddSection={handleAddSection}
                  onChangeSection={updateSectionAt}
                  onRemoveSection={removeSectionAt}
                  onReorder={reorderSections}
                />
              )}

              {isEdit && canManage && (
                <HomepagePanel isHomepage={isHomepage} onToggle={() => setIsHomepage((v) => !v)} />
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
                      <span className={`text-sm font-medium ${draft.status === "published" ? "text-(--color-success)" : "text-muted-foreground"}`}>
                        {draft.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <TranslationActions
                loading={loading}
                saveLabel={loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Page"}
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

      {removeLang && savedPage && (
        <TranslationRemoveConfirm
          lang={removeLang}
          itemLabel="page"
          onConfirm={async () => {
            await api.delete(`/pages/${savedPage._id}/details/${removeLang}`);
            handleDiscardDraft(removeLang);
            setSavedPage(
              (prev) => prev && { ...prev, details: prev.details.filter((d) => d.langKey !== removeLang) },
            );
          }}
          onClose={() => setRemoveLang(null)}
        />
      )}
    </div>
  );
}
