"use client";

import { useEffect, useState } from "react";
import {
  X,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Clock,
  Briefcase,
  Laptop,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { DeviceComplaint, ComplaintPriority } from "@/types";
import { Select } from "@/components/common/Select";

interface TechMember {
  id: string;
  name: string;
  email: string;
  role: "super-admin" | "team-member" | "viewer";
  status: "active" | "inactive" | "pending";
  department?: string | null;
}

interface AssignTicketModalProps {
  isOpen: boolean;
  ticket: DeviceComplaint | null;
  currentUserId?: string;
  onClose: () => void;
  onAssigned: (updatedTicket: DeviceComplaint) => void;
}

const PRIORITY_OPTIONS: {
  value: ComplaintPriority;
  label: string;
  badgeClass: string;
  activeRing: string;
}[] = [
  {
    value: "low",
    label: "Low",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    activeRing: "ring-2 ring-blue-500 bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold",
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    activeRing: "ring-2 ring-amber-500 bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold",
  },
  {
    value: "high",
    label: "High",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    activeRing: "ring-2 ring-orange-500 bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300 font-bold",
  },
  {
    value: "critical",
    label: "Urgent",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    activeRing: "ring-2 ring-rose-500 bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold",
  },
];

export function AssignTicketModal({
  isOpen,
  ticket,
  currentUserId,
  onClose,
  onAssigned,
}: AssignTicketModalProps) {
  const [techList, setTechList] = useState<TechMember[]>([]);
  const [workloadMap, setWorkloadMap] = useState<Record<string, number>>({});
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>("medium");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when ticket opens
  useEffect(() => {
    if (ticket) {
      setSelectedTechId(ticket.assignedTechId ?? "");
      setSelectedPriority(ticket.priority ?? "medium");
      setNotes("");
      setError(null);
    }
  }, [ticket]);

  // Fetch technicians and active workload
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function fetchTechniciansAndWorkload() {
      try {
        setLoadingTechs(true);
        setError(null);

        // Fetch all department users & active complaints simultaneously
        const [usersRes, complaintsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/tech/complaints"),
        ]);

        if (!usersRes.ok) {
          throw new Error("Unable to load tech team directory");
        }

        const allUsers: TechMember[] = await usersRes.json();
        const activeTechs = allUsers.filter(
          (u) =>
            (u.role === "super-admin" || u.role === "team-member") &&
            u.status === "active"
        );

        // Calculate workload from complaints
        const workload: Record<string, number> = {};
        activeTechs.forEach((t) => {
          workload[t.id] = 0;
        });

        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json();
          const complaintsList: any[] = complaintsData.complaints ?? [];
          complaintsList.forEach((c) => {
            const isAssigned = c.assigned_tech_id || c.assignedTechId;
            const isOpenTicket =
              c.status !== "resolved" &&
              c.status !== "closed" &&
              c.status !== "cancelled";

            if (isAssigned && isOpenTicket) {
              workload[isAssigned] = (workload[isAssigned] || 0) + 1;
            }
          });
        }

        if (isMounted) {
          setTechList(activeTechs);
          setWorkloadMap(workload);

          // If no technician currently assigned and not yet selected, suggest lowest load tech
          if (!ticket?.assignedTechId && activeTechs.length > 0) {
            const sortedByWorkload = [...activeTechs].sort(
              (a, b) => (workload[a.id] || 0) - (workload[b.id] || 0)
            );
            setSelectedTechId(sortedByWorkload[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load technician workload data");
        }
      } finally {
        if (isMounted) {
          setLoadingTechs(false);
        }
      }
    }

    fetchTechniciansAndWorkload();

    return () => {
      isMounted = false;
    };
  }, [isOpen, ticket]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !ticket) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket) return;

    if (!selectedTechId) {
      setError("Please select a technician to delegate this ticket to.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/tech/complaints/${ticket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTechId: selectedTechId,
          notes: notes.trim(),
          priority: selectedPriority,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delegate ticket");
      }

      const assignedTech = techList.find((t) => t.id === selectedTechId);

      const updatedTicket: DeviceComplaint = {
        ...ticket,
        assignedTechId: selectedTechId,
        assignedTechName: assignedTech?.name || data.assignedTechnician?.name || "Assigned Specialist",
        priority: selectedPriority,
        status: ticket.status === "submitted" ? "under-review" : ticket.status,
        techNotes: notes.trim()
          ? ticket.techNotes
            ? `${ticket.techNotes}\n[Delegated: ${notes.trim()}]`
            : `[Delegated: ${notes.trim()}]`
          : ticket.techNotes,
        updatedAt: new Date().toISOString(),
      };

      onAssigned(updatedTicket);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during delegation");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTechnician = techList.find((t) => t.id === selectedTechId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface text-foreground shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-foreground shadow-xs">
              <UserCheck className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {ticket.assignedTechId ? "Reassign Specialist" : "Delegate Hardware Ticket"}
                </h3>
                <span className="font-mono text-xs font-bold text-brand-teal bg-brand-teal/15 border border-brand-teal/30 px-2 py-0.5 rounded-md">
                  {ticket.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-muted">
                Dispatch ticket to a designated technician with priority & triage guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Context Overview Card */}
          <div className="rounded-xl border border-border bg-surface-elevated p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Issue Summary
                </span>
                <h4 className="text-sm font-bold text-foreground mt-0.5">
                  {ticket.title || ticket.issueType}
                </h4>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-surface text-foreground-muted border-border">
                {ticket.status.replace("-", " ").toUpperCase()}
              </span>
            </div>

            {ticket.description && (
              <p className="text-xs text-muted line-clamp-2">
                {ticket.description}
              </p>
            )}

            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-y-1 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-brand-teal" />
                <span>
                  Staff: <strong className="text-foreground">{ticket.userName}</strong>
                  {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""}
                </span>
              </div>
              {ticket.itemName && (
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-brand-teal" />
                  <span>
                    Device: <strong className="text-foreground">{ticket.itemName}</strong>
                    {ticket.itemSerial ? ` [${ticket.itemSerial}]` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Selection with Workload Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tech-select" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Assign To Technician <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-muted">
                {techList.length} specialists available
              </span>
            </div>

            {loadingTechs ? (
              <div className="flex items-center justify-center p-4 rounded-xl border border-border bg-surface-elevated text-xs text-muted gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-teal" />
                <span>Checking technician workloads...</span>
              </div>
            ) : techList.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
                No active tech team members available for assignment.
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  placeholder="Select an authorized tech specialist..."
                  required
                  options={techList.map((t) => {
                    const load = workloadMap[t.id] ?? 0;
                    return {
                      value: t.id,
                      label: `${t.name} (${t.role === "super-admin" ? "Lead Admin" : "Specialist"}) — ${load} open ${load === 1 ? "ticket" : "tickets"}`,
                    };
                  })}
                />

                {/* Selected Specialist Workload Pill Card */}
                {selectedTechnician && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-elevated text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-teal/20 text-brand-teal border border-brand-teal/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedTechnician.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {selectedTechnician.name}
                          {selectedTechnician.id === currentUserId && (
                            <span className="text-[10px] bg-brand-teal/20 text-brand-teal px-1.5 py-0.2 rounded font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted">{selectedTechnician.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {(() => {
                        const load = workloadMap[selectedTechnician.id] ?? 0;
                        if (load === 0) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Optimal (0 Active)
                            </span>
                          );
                        } else if (load <= 2) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                              <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              Moderate ({load} Active)
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              High Load ({load} Active)
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Priority Adjuster */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
              Adjust Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = selectedPriority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedPriority(opt.value)}
                    className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? opt.activeRing
                        : "border-border bg-surface text-muted hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delegation Notes Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="delegation-notes" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Triage Instructions & Notes
              </label>
              <span className="text-[11px] text-muted">Optional</span>
            </div>
            <textarea
              id="delegation-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inspect power delivery board, test battery cycle count, and coordinate with staff on Monday..."
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted shadow-xs outline-none transition-colors focus:border-brand-teal"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-elevated transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTechId || loadingTechs}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow hover:bg-brand-yellow/90 disabled:opacity-50 px-5 py-2 text-xs font-bold text-brand-navy transition-all shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Delegating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-brand-navy" />
                  <span>Assign Specialist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
