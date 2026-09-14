import Card from "./Card";

const INK_ON_TONE = {
  base: "text-ink",
  yellow: "text-yellow-dark",
  coral: "text-coral-dark",
  teal: "text-moss-dark",
  rose: "text-ink",
  orange: "text-orange-dark",
};

const LABEL_ON_TONE = {
  base: "text-steel",
  yellow: "text-yellow-dark/80",
  coral: "text-coral-dark/80",
  teal: "text-moss-dark/80",
  rose: "text-ink/70",
  orange: "text-orange-dark/80",
};

// Each KPI gets its own pastel tone, echoing design.md's sticky-note
// feature-card palette (§ Pastel feature cards) applied to dashboard
// tiles instead of marketing feature callouts.
export default function StatTile({ label, value, tone = "base" }) {
  return (
    <Card tone={tone} padding="sm">
      <p className={`text-xs font-semibold uppercase tracking-wide ${LABEL_ON_TONE[tone]}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${INK_ON_TONE[tone]}`}>{value}</p>
    </Card>
  );
}
