"use client";

import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { DepartmentUser } from "@/types";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export function AccessDetailsModal({
  user,
  onClose,
}: {
  user: DepartmentUser;
  onClose: () => void;
}) {
  return (
    <Modal title={user.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-sm">Account details</h3>
            <StatusPill status={user.status} />
          </div>
          <div className="mt-3 space-y-1">
            <DetailRow label="Name" value={user.name} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Role" value={user.role.replace("-", " ")} />
            <DetailRow label="Status" value={user.status} />
            <DetailRow label="Invited by" value={user.invitedBy ?? "—"} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
