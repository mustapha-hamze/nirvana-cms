import { useNavigate, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { api } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { EditIcon, TrashIcon } from "../components/icons";
import { Badge } from "@/components/ui/badge";
import EmptyState from "../components/ui/EmptyState";
import SkeletonTable from "../components/ui/SkeletonTable";
import ConfirmModal from "../components/ui/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import SortableHeader from "../components/ui/SortableHeader";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import ListSearchInput from "../components/ui/ListSearchInput";
import AdminTable, { AdminTableRow, AdminTableHeadCell, EmptyResultsRow } from "../components/ui/AdminTable";
import { TableHeader, TableBody } from "@/components/ui/table";
import AdminTableActionButton from "../components/ui/AdminTableActionButton";
import { LanguageStatusBadges } from "../components/ui/LanguageBadges";
import CreatedAtCell from "../components/ui/CreatedAtCell";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import { getPreviewTitle } from "../utils/translations";
import { getTextDirection, getRtlAwareClassName } from "../utils/rtl";
import { usePaginatedApiList } from "../hooks/usePaginatedApiList";
import { useState } from "react";
import {
  LANGUAGE_VALUES,
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
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const canManage = !!app && isAppAdmin(user, app._id);
  const [deleteContent, setDeleteContent] = useState<ContentItem | null>(null);
  const {
    searchInput, setSearchInput, search, sortBy, sortOrder, page, setPage, toggleSort,
    result, loading, refresh: fetchContents,
  } = usePaginatedApiList<ContentItem>({ endpoint: "/content", applicationId: app?._id });

  const { items: contents, total, totalPages, limit } = result;
  const hasAnyContent = total > 0 || search;

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title="Contents"
        subtitle={loading || !app ? "…" : `${total} item${total !== 1 ? "s" : ""} in ${app.name}`}
        actionLabel="Create Content"
        onAction={() => navigate(`/applications/${app?._id}/contents/create`)}
        actionDisabled={!app}
      />

      {hasAnyContent && <ListSearchInput value={searchInput} onChange={setSearchInput} />}

      {loading ? (
        <SkeletonTable />
      ) : !hasAnyContent ? (
        <EmptyState
          icon={<BigContentIcon />}
          title="No content yet"
          description="Create your first piece of content for this application."
          actionLabel="Create Content"
          onAction={() => navigate(`/applications/${app?._id}/contents/create`)}
        />
      ) : contents.length === 0 ? (
        <EmptyResultsRow message={`No content matches "${search}".`} />
      ) : (
        <AdminTable
          footer={<Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />}
        >
          <TableHeader>
            <tr>
              <SortableHeader label="Title" active={sortBy === "title"} direction={sortOrder} onClick={() => toggleSort("title")} />
              <AdminTableHeadCell>Languages</AdminTableHeadCell>
              {canManage && <AdminTableHeadCell>Categories</AdminTableHeadCell>}
              {canManage && <AdminTableHeadCell>Tags</AdminTableHeadCell>}
              <SortableHeader label="Created" active={sortBy === "createdAt"} direction={sortOrder} onClick={() => toggleSort("createdAt")} />
              <AdminTableHeadCell align="right">Actions</AdminTableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {contents.map((content) => {
              const preview = getPreviewDetail(content);
              return (
                <AdminTableRow key={content._id}>
                  <td className="px-5 py-3">
                    <span
                      dir={getTextDirection(preview?.title)}
                      className={cn("font-medium text-foreground", getRtlAwareClassName(preview?.title))}
                    >
                      {preview?.title ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <LanguageStatusBadges details={content.details} />
                  </td>
                  {canManage && (
                    <td className="px-5 py-3">
                      {content.categories.length === 0 ? (
                        <span className="text-(--color-text-tertiary)">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {content.categories.map((cat) => (
                            <Badge key={cat._id} variant="accent" className="text-[11px] font-semibold">
                              {getPreviewTitle(cat.translations)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  )}
                  {canManage && (
                    <td className="px-5 py-3">
                      {content.tags.length === 0 ? (
                        <span className="text-(--color-text-tertiary)">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {content.tags.map((tag) => (
                            <Badge key={tag._id} variant="neutral" className="text-[11px] font-semibold">
                              {getPreviewTitle(tag.translations)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  )}
                  <CreatedAtCell date={content.createdAt} />
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminTableActionButton
                        onClick={() => navigate(`/applications/${app?._id}/contents/${content._id}/edit`)}
                        title="Edit"
                        variant="accent"
                      >
                        <EditIcon />
                      </AdminTableActionButton>
                      {canManage && (
                        <AdminTableActionButton onClick={() => setDeleteContent(content)} title="Delete" variant="danger">
                          <TrashIcon />
                        </AdminTableActionButton>
                      )}
                    </div>
                  </td>
                </AdminTableRow>
              );
            })}
          </TableBody>
        </AdminTable>
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
      className="text-primary"
      stroke="currentColor"
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
