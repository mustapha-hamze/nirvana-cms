import { useState } from "react";
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
import IdCell from "../components/ui/IdCell";
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
import { usePaginatedApiList } from "../hooks/usePaginatedApiList";
import { getTextDirection, getRtlAwareClassName } from "../utils/rtl";
import { LANGUAGE_VALUES } from "../types/content";
import type { PageItem, PageDetail } from "../types/page";
import { useLocale } from "../i18n/useLocale";

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
  const { t } = useLocale();
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
        title={t('pagesList.title')}
        subtitle={loading || !app ? "…" : t(total === 1 ? 'pagesList.subtitleOne' : 'pagesList.subtitleOther', { count: total, app: app.name })}
        actionLabel={t('pagesList.createPage')}
        onAction={() => navigate(`/applications/${app?._id}/pages/create`)}
        actionDisabled={!app}
      />

      {hasAnyPage && <ListSearchInput value={searchInput} onChange={setSearchInput} />}

      {loading ? (
        <SkeletonTable />
      ) : !hasAnyPage ? (
        <EmptyState
          icon={<BigPageIcon />}
          title={t('pagesList.noPagesTitle')}
          description={t('pagesList.noPagesDescription')}
          actionLabel={t('pagesList.createPage')}
          onAction={() => navigate(`/applications/${app?._id}/pages/create`)}
        />
      ) : pages.length === 0 ? (
        <EmptyResultsRow message={t('pagesList.noPagesMatch', { search })} />
      ) : (
        <AdminTable
          footer={<Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />}
        >
          <TableHeader>
            <tr>
              <SortableHeader label={t('table.title')} active={sortBy === "title"} direction={sortOrder} onClick={() => toggleSort("title")} />
              <AdminTableHeadCell>{t('table.id')}</AdminTableHeadCell>
              <AdminTableHeadCell>{t('table.languages')}</AdminTableHeadCell>
              <SortableHeader label={t('table.created')} active={sortBy === "createdAt"} direction={sortOrder} onClick={() => toggleSort("createdAt")} />
              <AdminTableHeadCell align="end">{t('common.actions')}</AdminTableHeadCell>
            </tr>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const preview = getPreviewDetail(page);
              return (
                <AdminTableRow key={page._id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        dir={getTextDirection(preview?.title)}
                        className={cn("font-medium text-foreground", getRtlAwareClassName(preview?.title))}
                      >
                        {preview?.title ?? "—"}
                      </span>
                      {page.isHomepage && (
                        <Badge variant="accent" className="text-[11px] font-semibold">
                          {t('table.homepage')}
                        </Badge>
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
                        title={t('common.edit')}
                        variant="accent"
                      >
                        <EditIcon />
                      </AdminTableActionButton>
                      {canManage && (
                        <AdminTableActionButton onClick={() => setDeletePageState(page)} title={t('common.delete')} variant="danger">
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

      {deletePage && (
        <ConfirmModal
          title={t('pagesList.deleteConfirmTitle', { name: getPreviewDetail(deletePage)?.title ?? t('pagesList.deleteConfirmFallbackName') })}
          message={t('pagesList.deleteConfirmMessage')}
          confirmLabel={t('pagesList.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
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
      className="text-primary"
      stroke="currentColor"
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
