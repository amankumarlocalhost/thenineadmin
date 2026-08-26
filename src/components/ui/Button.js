const VARIANTS = {
  primary: "bg-stitch text-paper hover:bg-ink",
  secondary: "border border-line-paper bg-surface text-ink hover:border-stitch hover:text-stitch",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "text-ink/60 hover:bg-black/5 hover:text-ink",
};

const SIZES = {
  sm: "px-3.5 py-2 text-[11px]",
  md: "px-5 py-2.5 text-xs",
};

export function Button({ variant = "primary", size = "md", loading, className = "", children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-body font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
      {children}
    </button>
  );
}

export function IconButton({ className = "", children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/55 transition-colors hover:bg-black/5 hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}
