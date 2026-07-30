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
    <div className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between md:px-8 md:pt-6">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      {action && (
        <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
