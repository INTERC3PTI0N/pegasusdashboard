// Shown instantly on navigation while the next page's data loads.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-1/3 rounded-md bg-muted" />
      <div className="h-4 w-1/2 rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
