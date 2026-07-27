export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/45";
