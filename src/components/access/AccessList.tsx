"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { DepartmentUser, UserRole, UserStatus } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { Select } from "@/components/common/Select";
import { AccessDetailsModal } from "./AccessDetailsModal";

export function AccessList({
  users,
  currentUser,
}: {
  users: DepartmentUser[];
  currentUser: DepartmentUser;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DepartmentUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<DepartmentUser | null>(null);
  const [deleting, setDeleting] = useState<DepartmentUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.role !== b.role) return a.role === "super-admin" ? -1 : 1;
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [users]
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);

    const response = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setDeleteError(data?.error ?? "Couldn't remove access.");
      return;
    }

    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Access"
        description="Manage who can update department inventory"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="pressable flex items-center justify-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 rounded-lg bg-brand-yellow hover:brightness-105 text-brand-navy text-sm font-bold shadow-xs transition-all"
            aria-label="Add member"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add member</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        {/* Mobile: stacked cards */}
        <ul className="md:hidden space-y-3">
          {sortedUsers.map((user) => {
            const isOtherSuperAdmin = user.role === "super-admin" && user.id !== currentUser.id;
            return (
              <li
                key={user.id}
                className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isOtherSuperAdmin) setSelectedUser(user);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!isOtherSuperAdmin) setSelectedUser(user);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground break-words">
                      {user.name}
                      {user.id === currentUser.id && (
                        <span className="ml-2 text-xs text-muted font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted mt-0.5 break-words font-mono">{user.email}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusPill status={user.status} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-muted">Role</p>
                    <p className="text-foreground capitalize">{user.role.replace("-", " ")}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted">Invited by</p>
                    <p className="text-foreground truncate">{user.invitedBy ?? "-"}</p>
                  </div>
                </div>

                <div
                  className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (!isOtherSuperAdmin) setEditing(user);
                    }}
                    className="pressable p-2 rounded-lg hover:bg-background text-muted hover:text-foreground"
                    aria-label={`Edit ${user.name}`}
                    disabled={isOtherSuperAdmin}
                    title={
                      isOtherSuperAdmin ? "Cannot edit another super-admin" : undefined
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(user)}
                    className="pressable p-2 rounded-lg hover:bg-background text-muted hover:text-status-overdue disabled:opacity-40 disabled:hover:text-muted"
                    aria-label={`Remove ${user.name}`}
                    disabled={user.id === currentUser.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden md:block interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Invited by</th>
                <th className="px-4 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="table-row cursor-pointer border-b border-border last:border-0 hover:bg-accent-soft/70 text-foreground"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!(user.role === "super-admin" && user.id !== currentUser.id)) {
                      setSelectedUser(user);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!(user.role === "super-admin" && user.id !== currentUser.id)) {
                        setSelectedUser(user);
                      }
                    }
                  }}
                >
                  <td className="px-4 py-3 font-medium">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="ml-2 text-xs text-muted font-normal">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground font-mono text-xs">{user.email}</td>
                  <td className="px-4 py-3 text-foreground capitalize">
                    {user.role.replace("-", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground">{user.invitedBy ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!(user.role === "super-admin" && user.id !== currentUser.id)) {
                            setEditing(user);
                          }
                        }}
                        className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-foreground"
                        aria-label={`Edit ${user.name}`}
                        disabled={user.role === "super-admin" && user.id !== currentUser.id}
                        title={
                          user.role === "super-admin" && user.id !== currentUser.id
                            ? "Cannot edit another super-admin"
                            : undefined
                        }
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleting(user);
                        }}
                        className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-status-overdue disabled:opacity-40 disabled:hover:text-muted"
                        aria-label={`Remove ${user.name}`}
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <AccessDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {showCreate && (
        <UserFormModal
          currentUserId={currentUser.id}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <UserFormModal
          user={editing}
          currentUserId={currentUser.id}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border max-w-sm w-full p-5">
            <h2 className="font-semibold text-sm mb-1.5">Remove access</h2>
            <p className="text-sm text-muted mb-4">
              This removes access for &ldquo;{deleting.name}&rdquo;. Existing checkout history keeps
              their name for audit context.
            </p>
            {deleteError && (
              <p className="text-sm text-status-overdue mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleting(null);
                  setDeleteError(null);
                }}
                className="pressable flex-1 py-2 rounded-lg border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="pressable flex-1 py-2 rounded-lg bg-status-overdue text-white text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserFormModal({
  user,
  currentUserId,
  onClose,
}: {
  user?: DepartmentUser;
  currentUserId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const editingSelf = Boolean(user && currentUserId && user.id === currentUserId);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "team-member");
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setTemporaryPassword(null);

    const response = await fetch(isEdit ? `/api/users/${user?.id}` : "/api/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        role,
        status,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "Couldn't save access.");
      setSaving(false);
      return;
    }

    if (!isEdit && typeof data?.temporaryPassword === "string") {
      setTemporaryPassword(data.temporaryPassword);
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title={isEdit ? "Edit access" : "Add member"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amina Yusuf"
            required
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@r4cglobal.org"
            required
          />
        </FormField>

        <div className="mb-4">
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={editingSelf}
            options={[
              { value: "team-member", label: "Team member - can manage inventory" },
              { value: "super-admin", label: "Super-admin - can manage access" },
              { value: "viewer", label: "Viewer - can only view inventory" },
            ]}
          />
        </div>

        <div className="mb-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            disabled={editingSelf}
            options={[
              { value: "pending", label: "Pending" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          {!user && (
            <p className="text-xs text-muted mt-2">
              New members are invited in pending state. They sign in with the temporary password
              and are prompted to set a permanent password on first login.
            </p>
          )}
        </div>

        {editingSelf && (
          <p className="text-xs text-muted mb-3">
            Another super-admin must change your own role or access status.
          </p>
        )}

        {error && <p className="text-sm text-status-overdue mb-3">{error}</p>}
        {temporaryPassword && (
          <div className="rounded-lg border border-border bg-surface p-3 mb-3 text-sm text-muted">
            <p className="font-medium text-foreground mb-2">Account created</p>
            <p className="font-medium text-foreground">Temporary password</p>
            <p className="font-mono text-sm text-foreground break-all">{temporaryPassword}</p>
            <p className="text-xs text-muted mt-1">
              Share this temporary password with the invited user. They sign in once with this
              temporary password and will be prompted to set a permanent password.
            </p>
          </div>
        )}

        {temporaryPassword ? (
          <button
            type="button"
            onClick={onClose}
            className="pressable w-full py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground text-sm font-semibold transition-colors"
          >
            Close
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="pressable w-full py-2.5 rounded-lg bg-brand-yellow hover:brightness-105 text-brand-navy text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add member"}
          </button>
        )}
      </form>
    </Modal>
  );
}
