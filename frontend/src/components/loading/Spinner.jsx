export function Spinner({ size = "md", label, className = "", tone = "brand" }) {
  const sizes = { xs: "h-3 w-3 border-[1.5px]", sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-9 w-9 border-[2.5px]", xl: "h-12 w-12 border-3" };
  const tones = { brand: "border-brand/20 border-t-brand", white: "border-white/30 border-t-white", text: "border-text-secondary/20 border-t-text-secondary" };
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role={label ? "status" : undefined} aria-label={label}>
      <span aria-hidden="true" className={`inline-block shrink-0 rounded-full ${sizes[size] || sizes.md} ${tones[tone] || tones.brand} animate-cb-spin`} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function ButtonSpinner({ label = "Working…" }) {
  return <Spinner size="sm" tone="white" label={label} />;
}

export function PageLoader({ message = "Loading…" }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6 py-12" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner size="lg" label={message} />
        <p className="text-sm font-medium text-text-secondary">{message}</p>
      </div>
    </div>
  );
}

export function LoadingState({ message = "Loading…", compact = false }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-text-secondary ${compact ? "py-2" : "py-5"}`} role="status" aria-live="polite">
      <Spinner size="sm" label={message} />
      <span>{message}</span>
    </div>
  );
}

export function LoadingOverlay({ message = "Please wait…" }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-inherit bg-surface/75 backdrop-blur-[2px]" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
        <Spinner size="sm" label={message} />
        <span className="text-sm font-medium text-text">{message}</span>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-bg ${className}`} />;
}

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-2 h-3 w-3/5" />
      <Skeleton className="mt-5 h-20 w-full" />
    </div>
  );
}
