import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, TextField } from "../components/ui";

const ROLE_HOME = {
  admin: "/admin",
  control: "/control",
  engineering: "/engineering",
  electrical: "/electrical",
  snt: "/snt",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || "/");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-yellow text-base font-bold text-primary">
            R
          </span>
          <span className="text-lg font-semibold text-ink">RailOptix</span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-card-lg border border-hairline-soft bg-canvas p-8 shadow-[0_4px_12px_0_rgba(20,21,15,0.06)]">
          <h1 className="text-xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-steel">Sign in to coordinate block requests.</p>

          {error && (
            <div className="mt-4 rounded-input border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" variant="primary" size="md" disabled={loading} className="mt-6 w-full">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
