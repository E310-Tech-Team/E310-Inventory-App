export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 md:px-8 pt-4 sm:pt-6 pb-3.5 sm:pb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}
