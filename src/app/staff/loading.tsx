import { E310Logo } from "@/components/common/E310Logo";

export default function StaffPortalLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3.5 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="sm:hidden">
              <E310Logo size="xs" />
            </span>
            <span className="hidden sm:inline-flex">
              <E310Logo size="sm" />
            </span>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="h-7 w-20 rounded-lg bg-surface-elevated animate-pulse" />
              <div className="h-7 w-24 rounded-lg bg-surface-elevated/60 animate-pulse" />
              <div className="h-7 w-28 rounded-lg bg-surface-elevated/60 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-7 w-16 sm:w-20 rounded-lg bg-surface-elevated animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-surface-elevated/70 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-surface-elevated animate-pulse" />
          </div>
        </div>
        <div className="sm:hidden border-t border-border/50 bg-surface-elevated/30 px-3.5 py-1.5 grid grid-cols-3 gap-1.5">
          <div className="h-8 rounded-lg bg-surface-elevated animate-pulse" />
          <div className="h-8 rounded-lg bg-surface-elevated/60 animate-pulse" />
          <div className="h-8 rounded-lg bg-surface-elevated/60 animate-pulse" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-6 sm:pt-10 lg:pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-10 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 sm:pb-4 border-b border-border/60">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-surface-elevated animate-pulse" />
            <div className="h-4 w-72 max-w-full rounded-md bg-surface-elevated/60 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <div className="h-9 sm:w-28 rounded-xl bg-surface-elevated animate-pulse" />
            <div className="h-9 sm:w-32 rounded-xl bg-surface-elevated animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="h-24 sm:h-28 rounded-2xl border border-border/70 bg-surface animate-pulse" />
          <div className="h-24 sm:h-28 rounded-2xl border border-border/70 bg-surface animate-pulse" />
          <div className="col-span-2 sm:col-span-1 h-16 sm:h-28 rounded-2xl border border-border/70 bg-surface animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 h-56 sm:h-64 rounded-2xl border border-border/70 bg-surface animate-pulse" />
          <div className="lg:col-span-4 h-48 sm:h-64 rounded-2xl border border-border/70 bg-surface animate-pulse" />
        </div>
      </main>
    </div>
  );
}

