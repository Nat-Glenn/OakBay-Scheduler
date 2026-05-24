/**
 * Centered empty/placeholder block for lists and panels.
 */

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-8 text-center">
      {Icon ? (
        <Icon className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
      ) : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
