import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { theme } from "../theme";
import { PlusIcon, EditIcon, TrashIcon } from "../components/icons";
import ContentModal from "../components/ContentModal";
import EmptyState from "../components/ui/EmptyState";
import SkeletonTable from "../components/ui/SkeletonTable";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import {
  LANGUAGE_VALUES,
  LANGUAGE_LABELS,
  type ContentItem,
  type ContentDetail,
} from "../types/content";

function getPreviewDetail(content: ContentItem): ContentDetail | undefined {
  for (const lang of LANGUAGE_VALUES) {
    const match = content.details.find((d) => d.langKey === lang);
    if (match) return match;
  }
  return content.details[0];
}

export default function Contents() {
  const { app } = useOutletContext<AdminOutletContext>();
  const user = useAppSelector(selectUser);
  const canManage = !!app && isAppAdmin(user, app._id);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [deleteContent, setDeleteContent] = useState<ContentItem | null>(null);

  const fetchContents = useCallback(async () => {
    if (!app) return;
    setLoading(true);
    try {
      const data = await api.get<ContentItem[]>(
        `/content?application=${app._id}`,
      );
      setContents(data);
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return (
    <div className="mx-10 my-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: theme.textPrimary }}
          >
            Contents
          </h1>
          <p
            className="mt-1 text-[15px]"
            style={{ color: theme.textSecondary }}
          >
            {loading || !app
              ? "…"
              : `${contents.length} item${contents.length !== 1 ? "s" : ""} in ${app.name}`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!app}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{
            background: theme.accentGradient,
            boxShadow: "0 2px 16px rgba(124,58,237,0.35)",
          }}
        >
          <PlusIcon />
          Create Content
        </button>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : contents.length === 0 ? (
        <EmptyState
          icon={<BigContentIcon />}
          title="No content yet"
          description="Create your first piece of content for this application."
          actionLabel="Create Content"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                <th
                  className="text-left font-semibold px-5 py-3"
                  style={{ color: theme.textTertiary }}
                >
                  Title
                </th>
                <th
                  className="text-left font-semibold px-5 py-3"
                  style={{ color: theme.textTertiary }}
                >
                  Languages
                </th>
                {canManage && (
                  <th
                    className="text-left font-semibold px-5 py-3"
                    style={{ color: theme.textTertiary }}
                  >
                    Categories
                  </th>
                )}
                {canManage && (
                  <th
                    className="text-left font-semibold px-5 py-3"
                    style={{ color: theme.textTertiary }}
                  >
                    Tags
                  </th>
                )}
                <th
                  className="text-left font-semibold px-5 py-3"
                  style={{ color: theme.textTertiary }}
                >
                  Created
                </th>
                <th
                  className="text-right font-semibold px-5 py-3"
                  style={{ color: theme.textTertiary }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => {
                const preview = getPreviewDetail(content);
                return (
                  <tr
                    key={content._id}
                    style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.rowHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td className="px-5 py-3">
                      <span
                        className="font-medium"
                        style={{ color: theme.textPrimary }}
                      >
                        {preview?.title ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {content.details.map((d) => (
                          <span
                            key={d.langKey}
                            title={`${LANGUAGE_LABELS[d.langKey]} — ${d.status}`}
                            className="text-[11px] font-semibold px-2 py-1 rounded-full"
                            style={
                              d.status === "published"
                                ? {
                                    background: theme.successBg,
                                    color: theme.success,
                                  }
                                : {
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.5)",
                                  }
                            }
                          >
                            {d.langKey.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3">
                        {content.categories.length === 0 ? (
                          <span style={{ color: theme.textTertiary }}>—</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {content.categories.map((cat) => (
                              <span
                                key={cat._id}
                                className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                style={{
                                  background: theme.accentBg,
                                  color: theme.accent,
                                }}
                              >
                                {cat.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    {canManage && (
                      <td className="px-5 py-3">
                        {content.tags.length === 0 ? (
                          <span style={{ color: theme.textTertiary }}>—</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {content.tags.map((tag) => (
                              <span
                                key={tag._id}
                                className="text-[11px] font-semibold px-2 py-1 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  color: theme.textSecondary,
                                }}
                              >
                                {tag.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    <td
                      className="px-5 py-3"
                      style={{ color: theme.textTertiary }}
                    >
                      {new Date(content.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditContent(content)}
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
                            onClick={() => setDeleteContent(content)}
                            title="Delete"
                            aria-label="Delete"
                            className="p-2 rounded-lg transition-all"
                            style={{ color: theme.danger }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = theme.dangerHover;
                              e.currentTarget.style.background =
                                theme.dangerBgHover;
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

      {(showCreate || editContent) && app && (
        <ContentModal
          applicationId={app._id}
          allowedLanguages={app.languages ?? LANGUAGE_VALUES}
          content={editContent}
          onClose={() => {
            setShowCreate(false);
            setEditContent(null);
          }}
          onSaved={fetchContents}
        />
      )}
      {deleteContent && (
        <ConfirmModal
          title="Delete this content?"
          message="This will remove the content and all its translations. This action cannot be undone."
          confirmLabel="Delete Content"
          loadingLabel="Deleting…"
          onConfirm={() =>
            api.delete(`/content/${deleteContent._id}`).then(fetchContents)
          }
          onClose={() => setDeleteContent(null)}
        />
      )}
    </div>
  );
}

function BigContentIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <line x1="8" x2="16" y1="13" y2="13" />
      <line x1="8" x2="16" y1="17" y2="17" />
    </svg>
  );
}
