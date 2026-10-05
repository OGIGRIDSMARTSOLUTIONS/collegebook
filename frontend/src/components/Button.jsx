export function Button({ variant = 'primary', className = '', children, disabled, loading = false, loadingLabel = 'Working…', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    secondary: 'border border-border bg-surface text-text hover:bg-bg',
    ghost: 'text-text-secondary hover:text-text',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };
  return (
    <button aria-busy={loading || undefined} className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <><span className="animate-cb-spin inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" /><span>{loadingLabel}</span></> : children}
    </button>
  );
}
