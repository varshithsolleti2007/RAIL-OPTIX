const VARIANTS = {
  neutral: "bg-surface text-slate",
  yellow: "bg-yellow-light text-yellow-dark",
  purple: "bg-surface-featured text-brand-blue",
  coral: "bg-coral-light text-coral-dark",
  teal: "bg-teal-light text-moss-dark",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
};

// Status → badge variant, shared everywhere a BlockRequest/Schedule
// status is rendered so the mapping only lives in one place.
export const STATUS_BADGE = {
  DRAFT: "neutral",
  SUBMITTED: "yellow",
  APPROVED: "purple",
  SCHEDULED: "success",
  IN_PROGRESS: "purple",
  COMPLETED: "neutral",
  REJECTED: "danger",
  FAILED: "danger",
  CANCELLED: "neutral",
  OPEN: "warning",
  RESOLVED: "success",
  PUBLISHED: "success",
};

export default function Badge({ variant = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
