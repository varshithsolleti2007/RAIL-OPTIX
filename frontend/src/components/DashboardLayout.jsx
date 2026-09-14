import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";

// Sticky white top nav with the yellow wordmark, per design.md's
// "Top Navigation (Marketing)" pattern - {colors.brand-yellow} reserved
// for the wordmark, page title alongside it, secondary actions as
// outline pills on the right.
export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-hairline bg-canvas px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-yellow text-sm font-bold text-primary">
            R
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-ink">RailOptix</p>
            <p className="text-xs leading-tight text-steel">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-ink">{user?.name}</p>
            <p className="text-xs text-steel">
              {user?.department ? `${user.department} · ` : ""}
              {user?.role}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
