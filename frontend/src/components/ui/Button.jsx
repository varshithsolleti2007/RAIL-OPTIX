const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-charcoal disabled:bg-hairline disabled:text-muted",
  yellow: "bg-brand-yellow text-primary hover:bg-brand-yellow-deep disabled:bg-hairline disabled:text-muted",
  blue: "bg-brand-blue text-on-primary hover:bg-blue-pressed disabled:bg-hairline disabled:text-muted",
  secondary: "bg-transparent text-ink border border-hairline-strong hover:bg-surface disabled:text-muted disabled:border-hairline",
  danger: "bg-danger-bg text-danger hover:bg-coral-light disabled:bg-hairline disabled:text-muted",
  ghost: "bg-transparent text-ink hover:bg-surface disabled:text-muted",
  link: "bg-transparent text-brand-blue hover:text-blue-pressed p-0 rounded-none",
};

const SIZES = {
  md: "px-6 py-3 text-sm",
  sm: "px-4 py-1.5 text-xs",
  xs: "px-3 py-1 text-xs",
};

// Pill-shaped buttons per design.md - {rounded.full} on every button,
// black primary as the dominant CTA. `link` is the one rectangular,
// no-padding exception (inline text link).
export default function Button({
  variant = "primary",
  size = "sm",
  className = "",
  children,
  ...props
}) {
  const shape = variant === "link" ? "" : "rounded-pill";
  const sizeClass = variant === "link" ? "text-sm" : SIZES[size];

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:cursor-not-allowed ${shape} ${sizeClass} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
