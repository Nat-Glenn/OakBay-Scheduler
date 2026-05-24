/**
 * Shared page header: desktop title/description plus a slot for toolbar actions.
 * Mobile title is shown in AppShell's top bar via the `title` prop on AppShell.
 */

export default function PageHeader({ title, description, leading, actions }) {
  return (
    <header className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 hidden md:block">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
