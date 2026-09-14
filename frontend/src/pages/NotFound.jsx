import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface">
      <h1 className="text-2xl font-semibold text-ink">404</h1>
      <p className="text-steel">Page not found.</p>
      <Link to="/" className="text-sm text-brand-blue hover:text-blue-pressed hover:underline">
        Go home
      </Link>
    </div>
  );
}
