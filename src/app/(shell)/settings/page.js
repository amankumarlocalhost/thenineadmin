"use client";

import { useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/EmptyState";

export default function SettingsPage() {
  usePageTitle("Settings & Team");
  const { user: me } = useAuth();
  const toast = useToast();
  const { data: staff, loading, error, reload } = useFetch(() => api.get("/users", { role: "staff", limit: 100 }).then((r) => r.data.items), []);

  const canManage = me?.role === "super_admin" || me?.role === "admin";

  async function handleRoleChange(userId, role) {
    try {
      await api.patch(`/users/${userId}`, { role });
      toast.success("Role updated");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update role");
    }
  }

  async function handleToggleActive(u) {
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? "Account disabled" : "Account enabled");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not update account");
    }
  }

  const columns = [
    { key: "name", header: "Name", render: (u) => (
        <div>
          <span className="font-medium">{u.name}</span>
          {u.id === me?.id && <span className="ml-1.5 font-mono text-[10px] text-ink/40">(you)</span>}
        </div>
      ) },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (u) =>
        canManage ? (
          <Select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="w-44 py-1.5 text-xs">
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        ) : (
          <span className="font-mono text-xs">{ROLE_LABELS[u.role] || u.role}</span>
        ),
    },
    { key: "status", header: "Status", render: (u) => (
        <button type="button" disabled={!canManage} onClick={() => handleToggleActive(u)} className="disabled:cursor-default">
          <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Disabled"}</Badge>
        </button>
      ) },
  ];

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Card title="Your Account">
        <dl className="flex flex-col gap-2 font-body text-sm">
          <div className="flex justify-between"><dt className="text-ink/50">Name</dt><dd className="text-ink">{me?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/50">Email</dt><dd className="text-ink">{me?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/50">Role</dt><dd className="text-ink">{ROLE_LABELS[me?.role] || me?.role}</dd></div>
        </dl>
      </Card>

      <Card
        title="Team"
        padded={false}
      >
        {!canManage && (
          <p className="border-b border-line-paper px-5 py-3 font-body text-xs text-ink/50">
            Only Super Admin / Admin accounts can change roles or disable accounts here.
          </p>
        )}
        <DataTable columns={columns} rows={staff} loading={loading} emptyTitle="No staff accounts found" rowKey="id" />
      </Card>
    </div>
  );
}
