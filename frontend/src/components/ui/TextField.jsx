export const inputClass =
  "w-full rounded-input border border-hairline-strong bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-light";

export default function TextField({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-slate">{label}</span>}
      <input className={`${inputClass} ${className}`} {...props} />
    </label>
  );
}
