import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "../store/authSlice";
import { BackIcon, EditIcon, TrashIcon } from "../components/icons";
import Layout from "../components/Layout";
import CreateSuperAdminModal from "../components/CreateSuperAdminModal";
import EditSuperAdminModal from "../components/EditSuperAdminModal";
import Avatar from "../components/ui/UserAvatar";
import SkeletonTable from "../components/ui/SkeletonTable";
import ConfirmModal from "../components/ui/ConfirmModal";
import AdminPageHeader from "../components/ui/AdminPageHeader";
import AdminTable, { AdminTableRow, AdminTableHeadCell } from "../components/ui/AdminTable";
import AdminTableActionButton from "../components/ui/AdminTableActionButton";
import { TableHeader, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "../i18n/useLocale";

type SuperAdminUser = {
  _id: string;
  name: string;
  displayEmail: string;
  createdAt: string;
};

export default function SuperAdmins() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const currentUser = useAppSelector(selectUser);
  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAdmin, setEditAdmin] = useState<SuperAdminUser | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<SuperAdminUser | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await api.get<SuperAdminUser[]>("/users?role=SuperAdmin");
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Button variant="link" className="mb-6 h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => navigate("/applications")}>
          <BackIcon size={16} />
          {t('nav.applications')}
        </Button>

        <AdminPageHeader
          title={t('superAdmins.title')}
          subtitle={loading ? "…" : t(admins.length === 1 ? 'superAdmins.subtitleOne' : 'superAdmins.subtitleOther', { count: admins.length })}
          actionLabel={t('superAdmins.addSuperAdmin')}
          onAction={() => setShowCreate(true)}
        />

        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <AdminTable>
            <TableHeader>
              <tr>
                <AdminTableHeadCell>{t('common.name')}</AdminTableHeadCell>
                <AdminTableHeadCell>{t('table.email')}</AdminTableHeadCell>
                <AdminTableHeadCell>{t('table.joined')}</AdminTableHeadCell>
                <AdminTableHeadCell align="end">{t('common.actions')}</AdminTableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isSelf = admin._id === currentUser?._id;
                return (
                  <AdminTableRow key={admin._id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={admin.name} />
                        <span className="font-medium text-foreground">
                          {admin.name}
                          {isSelf && (
                            <Badge variant="accent" className="ms-2 text-[11px] font-semibold">
                              {t('common.you')}
                            </Badge>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground" dir="ltr">
                      {admin.displayEmail}
                    </td>
                    <td className="px-5 py-3 text-(--color-text-tertiary)">
                      {new Date(admin.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AdminTableActionButton onClick={() => setEditAdmin(admin)} title={t('common.edit')} variant="accent">
                          <EditIcon />
                        </AdminTableActionButton>
                        <AdminTableActionButton
                          onClick={() => setDeleteAdmin(admin)}
                          title={isSelf ? t('superAdmins.cantDeleteOwnAccount') : t('common.delete')}
                          variant="danger"
                          disabled={isSelf}
                        >
                          <TrashIcon />
                        </AdminTableActionButton>
                      </div>
                    </td>
                  </AdminTableRow>
                );
              })}
            </TableBody>
          </AdminTable>
        )}
      </div>

      {showCreate && (
        <CreateSuperAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchAdmins}
        />
      )}
      {editAdmin && (
        <EditSuperAdminModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={fetchAdmins}
        />
      )}
      {deleteAdmin && (
        <ConfirmModal
          title={t('superAdmins.deleteConfirmTitle', { name: deleteAdmin.name })}
          message={t('superAdmins.deleteConfirmMessage')}
          confirmLabel={t('superAdmins.deleteConfirmLabel')}
          loadingLabel={t('common.deleting')}
          onConfirm={() =>
            api.delete(`/users/${deleteAdmin._id}`).then(fetchAdmins)
          }
          onClose={() => setDeleteAdmin(null)}
        />
      )}
    </Layout>
  );
}
