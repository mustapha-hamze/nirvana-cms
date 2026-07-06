import { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { theme } from "../theme";
import { PlusIcon, EditIcon, TrashIcon } from "../components/icons";
import EmptyState from "../components/ui/EmptyState";
import SkeletonTable from "../components/ui/SkeletonTable";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import { LANGUAGE_VALUES, LANGUAGE_LABELS } from "../types/content";
import type { PageItem, PageDetail } from "../types/page";

function getPreviewDetail(page: PageItem): PageDetail | undefined {
  for (const lang of LANGUAGE_VALUES) {
    const match = page.details.find((d) => d.langKey === lang);
    if (match) return match;
  }
  return page.details[0];
}

export default function Pages() {
  const { app } = useOutletContext<AdminOutletContext>();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const canManage = !!app && isAppAdmin(user, app._id);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePage, setDeletePageState] = useState<PageItem | null>(null);

  const fetchPages = useCallback(async () => {
    if (!app) return;
    setLoading(true);
    try {
      const data = await api.get<PageItem[]>(`/pages?application=${app._id}`);
      setPages(data);
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Pages
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: theme.textSecondary }}>
            {loading || !app ? "…" : `${pages.length} page${pages.length !== 1 ? "s" : ""} in ${app.name}`}
          </p>
        </div>
        <button
          onClick={() => navigate(`/applications/${app?._id}/pages/create`)}
          disabled={!app}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ background: theme.accentGradient, boxShadow: "0 2px 16px rgba(124,58,237,0.35)" }}
        >
          <PlusIcon />
          Create Page
        </button>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : pages.length === 0 ? (
        <EmptyState
          icon={<BigPageIcon />}
          title="No pages yet"
          description="Build the pages that make up this application's site — Home, About Us, Contact Us, and more."
          actionLabel="Create Page"
          onAction={() => navigate(`/applications/${app?._id}/pages/create`)}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Title</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Languages</th>
                <th className="text-left font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Created</th>
                <th className="text-right font-semibold px-5 py-3" style={{ color: theme.textTertiary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const preview = getPreviewDetail(page);
                return (
                  <tr
                    key={page._id}
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = theme.rowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: theme.textPrimary }}>
                          {preview?.title ?? "—"}
                        </span>
                        {page.isHomepage && (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: theme.accentBg, color: theme.accent }}
                          >
                            Homepage
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {page.details.map((d) => (
                          <span
                            key={d.langKey}
                            title={`${LANGUAGE_LABELS[d.langKey]} — ${d.status}`}
                            className="text-[11px] font-semibold px-2 py-1 rounded-full"
                            style={
                              d.status === "published"
                                ? { background: theme.successBg, color: theme.success }
                                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
                            }
                          >
                            {d.langKey.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
                      {new Date(page.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/applications/${app?._id}/pages/${page._id}/edit`)}
                          title="Edit"
                          aria-label="Edit"
                          className="p-2 rounded-lg transition-all"
                          style={{ color: theme.accent }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = theme.accentHover;
                            e.currentTarget.style.background = theme.accentBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme.accent;
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <EditIcon />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => setDeletePageState(page)}
                            title="Delete"
                            aria-label="Delete"
                            className="p-2 rounded-lg transition-all"
                            style={{ color: theme.danger }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = theme.dangerHover;
                              e.currentTarget.style.background = theme.dangerBgHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = theme.danger;
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deletePage && (
        <ConfirmModal
          title={`Delete "${getPreviewDetail(deletePage)?.title ?? "this page"}"?`}
          message="This will remove the page and all its translations. This action cannot be undone."
          confirmLabel="Delete Page"
          loadingLabel="Deleting…"
          onConfirm={() => api.delete(`/pages/${deletePage._id}`).then(fetchPages)}
          onClose={() => setDeletePageState(null)}
        />
      )}
    </div>
  );
}

function BigPageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7c3aed"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}
