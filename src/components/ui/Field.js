export function Field({ label, error, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="font-body text-xs font-medium text-ink/70">{label}</span>}
      <div className={label ? "mt-1.5" : ""}>{children}</div>
      {error && <span className="mt-1 block font-body text-xs text-danger">{error}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg border border-line-paper bg-surface px-3.5 py-2.5 font-body text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-stitch disabled:bg-surface-sunken disabled:text-ink/40";

export function Input({ className = "", ...props }) {
  return <input {...props} className={`${baseInput} ${className}`} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return <textarea {...props} rows={rows} className={`${baseInput} resize-y ${className}`} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select {...props} className={`${baseInput} ${className}`}>
      {children}
    </select>
  );
}

export function SearchInput({ className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">⌕</span>
      <input {...props} className={`${baseInput} pl-9`} />
    </div>
  );
}
