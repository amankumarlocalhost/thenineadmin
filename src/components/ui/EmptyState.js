export function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="font-serif text-base text-ink">{title}</p>
      {description && <p className="max-w-sm font-body text-sm text-ink/50">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="font-serif text-base text-danger">Couldn&apos;t load this</p>
      <p className="max-w-sm font-body text-sm text-ink/50">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-line-paper px-5 py-2 font-body text-xs font-semibold uppercase tracking-wide text-ink hover:border-stitch hover:text-stitch"
        >
          Try again
        </button>
      )}
    </div>
  );
}
