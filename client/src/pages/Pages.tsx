import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { api } from "../api/client";
import type { AdminOutletContext } from "../components/AdminLayout";
import { theme } from "../theme";
import { EditIcon, TrashIcon } from "../components/icons";
import EmptyState from "../components/ui/EmptyState";
import SkeletonTable from "../components/ui/SkeletonTable";
import ConfirmModal from "../components/ui/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import SortableHeader from "../components/ui/SortableHeader";
import IdCell from "../components/ui/IdCell";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import ListSearchInput from "../components/ui/ListSearchInput";
import AdminTable, { AdminTableRow, AdminTableHeadCell, EmptyResultsRow } from "../components/ui/AdminTable";
import AdminTableActionButton from "../components/ui/AdminTableActionButton";
import { LanguageStatusBadges } from "../components/ui/LanguageBadges";
import CreatedAtCell from "../components/ui/CreatedAtCell";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { isAppAdmin } from "../utils/permissions";
import { usePaginatedApiList } from "../hooks/usePaginatedApiList";
import { LANGUAGE_VALUES } from "../types/content";
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
  const [deletePage, setDeletePageState] = useState<PageItem | null>(null);
  const {
    searchInput, setSearchInput, search, sortBy, sortOrder, page, setPage, toggleSort,
    result, loading, refresh: fetchPages,
  } = usePaginatedApiList<PageItem>({ endpoint: "/pages", applicationId: app?._id });

  const { items: pages, total, totalPages, limit } = result;
  const hasAnyPage = total > 0 || search;

  return (
    <div className="mx-10 my-10">
      <AdminPageHeader
        title="Pages"
        subtitle={loading || !app ? "…" : `${total} page${total !== 1 ? "s" : ""} in ${app.name}`}
        actionLabel="Create Page"
        onAction={() => navigate(`/applications/${app?._id}/pages/create`)}
        actionDisabled={!app}
      />

      {hasAnyPage && <ListSearchInput value={searchInput} onChange={setSearchInput} />}

      {loading ? (
        <SkeletonTable />
      ) : !hasAnyPage ? (
        <EmptyState
          icon={<BigPageIcon />}
          title="No pages yet"
          description="Build the pages that make up this application's site — Home, About Us, Contact Us, and more."
          actionLabel="Create Page"
          onAction={() => navigate(`/applications/${app?._id}/pages/create`)}
        />
      ) : pages.length === 0 ? (
        <EmptyResultsRow message={`No pages match "${search}".`} />
      ) : (
        <AdminTable
          footer={<Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              <SortableHeader label="Title" active={sortBy === "title"} direction={sortOrder} onClick={() => toggleSort("title")} />
              <AdminTableHeadCell>ID</AdminTableHeadCell>
              <AdminTableHeadCell>Languages</AdminTableHeadCell>
              <SortableHeader label="Created" active={sortBy === "createdAt"} direction={sortOrder} onClick={() => toggleSort("createdAt")} />
              <AdminTableHeadCell align="right">Actions</AdminTableHeadCell>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const preview = getPreviewDetail(page);
              return (
                <AdminTableRow key={page._id}>
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
                    <IdCell id={page._id} />
                  </td>
                  <td className="px-5 py-3">
                    <LanguageStatusBadges details={page.details} />
                  </td>
                  <CreatedAtCell date={page.createdAt} />
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminTableActionButton
                        onClick={() => navigate(`/applications/${app?._id}/pages/${page._id}/edit`)}
                        title="Edit"
                        variant="accent"
                      >
                        <EditIcon />
                      </AdminTableActionButton>
                      {canManage && (
                        <AdminTableActionButton onClick={() => setDeletePageState(page)} title="Delete" variant="danger">
                          <TrashIcon />
                        </AdminTableActionButton>
                      )}
                    </div>
                  </td>
                </AdminTableRow>
              );
            })}
          </tbody>
        </AdminTable>
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
