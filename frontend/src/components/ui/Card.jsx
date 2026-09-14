const TONES = {
  base: "bg-canvas border border-hairline-soft",
  yellow: "bg-yellow-light border border-transparent",
  coral: "bg-coral-light border border-transparent",
  teal: "bg-teal-light border border-transparent",
  rose: "bg-rose-light border border-transparent",
  orange: "bg-brand-orange-light border border-transparent",
  dark: "bg-primary text-on-primary border border-transparent",
};

const PADDING = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({ tone = "base", padding = "md", className = "", children, ...props }) {
  return (
    <div className={`rounded-card ${TONES[tone]} ${PADDING[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}
