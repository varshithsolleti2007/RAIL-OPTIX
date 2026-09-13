import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900">404</h1>
      <p className="text-slate-500">Page not found.</p>
      <Link to="/" className="text-blue-600 hover:underline text-sm">
        Go home
      </Link>
    </div>
  );
}
