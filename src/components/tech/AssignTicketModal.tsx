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
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    activeRing: "ring-2 ring-blue-500 bg-blue-50/60 border-blue-300 text-blue-900",
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    activeRing: "ring-2 ring-amber-500 bg-amber-50/60 border-amber-300 text-amber-900",
  },
  {
    value: "high",
    label: "High",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    activeRing: "ring-2 ring-orange-500 bg-orange-50/60 border-orange-300 text-orange-900",
  },
  {
    value: "critical",
    label: "Urgent",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    activeRing: "ring-2 ring-rose-500 bg-rose-50/60 border-rose-300 text-rose-900",
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
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 px-6 py-4 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
              <UserCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900">
                  {ticket.assignedTechId ? "Reassign Specialist" : "Delegate Hardware Ticket"}
                </h3>
                <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                  {ticket.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Dispatch ticket to a designated technician with priority & triage guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Context Overview Card */}
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Issue Summary
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-0.5">
                  {ticket.title || ticket.issueType}
                </h4>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200">
                {ticket.status.replace("-", " ").toUpperCase()}
              </span>
            </div>

            {ticket.description && (
              <p className="text-xs text-neutral-600 line-clamp-2">
                {ticket.description}
              </p>
            )}

            <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap items-center justify-between gap-y-1 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  Staff: <strong className="text-neutral-800">{ticket.userName}</strong>
                  {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""}
                </span>
              </div>
              {ticket.itemName && (
                <div className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Device: <strong className="text-neutral-800">{ticket.itemName}</strong>
                    {ticket.itemSerial ? ` [${ticket.itemSerial}]` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Selection with Workload Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tech-select" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Assign To Technician <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-neutral-500">
                {techList.length} specialists available
              </span>
            </div>

            {loadingTechs ? (
              <div className="flex items-center justify-center p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                <span>Checking technician workloads...</span>
              </div>
            ) : techList.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
                No active tech team members available for assignment.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    id="tech-select"
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-neutral-900 shadow-xs outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    required
                  >
                    <option value="" disabled>
                      Select an authorized tech specialist...
                    </option>
                    {techList.map((t) => {
                      const load = workloadMap[t.id] ?? 0;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.role === "super-admin" ? "Lead Admin" : "Specialist"}) — {load} open {load === 1 ? "ticket" : "tickets"}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>

                {/* Selected Specialist Workload Pill Card */}
                {selectedTechnician && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/90 bg-neutral-50/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedTechnician.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          {selectedTechnician.name}
                          {selectedTechnician.id === currentUserId && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500">{selectedTechnician.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {(() => {
                        const load = workloadMap[selectedTechnician.id] ?? 0;
                        if (load === 0) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Optimal (0 Active)
                            </span>
                          );
                        } else if (load <= 2) {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Moderate ({load} Active)
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
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
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 block">
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
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
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
              <label htmlFor="delegation-notes" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Triage Instructions & Notes
              </label>
              <span className="text-[11px] text-neutral-400">Optional</span>
            </div>
            <textarea
              id="delegation-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inspect power delivery board, test battery cycle count, and coordinate with staff on Monday..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-xs outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTechId || loadingTechs}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Delegating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
