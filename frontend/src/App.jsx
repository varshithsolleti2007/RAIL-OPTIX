import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import EngineeringDashboard from "./pages/dashboards/EngineeringDashboard";
import ElectricalDashboard from "./pages/dashboards/ElectricalDashboard";
import SnTDashboard from "./pages/dashboards/SnTDashboard";
import ControlDashboard from "./pages/dashboards/ControlDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

const ROLE_HOME = {
  admin: "/admin",
  control: "/control",
  engineering: "/engineering",
  electrical: "/electrical",
  snt: "/snt",
};

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleHomeRedirect />} />

      <Route element={<ProtectedRoute allowedRoles={["engineering"]} />}>
        <Route path="/engineering" element={<EngineeringDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["electrical"]} />}>
        <Route path="/electrical" element={<ElectricalDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["snt"]} />}>
        <Route path="/snt" element={<SnTDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["control"]} />}>
        <Route path="/control" element={<ControlDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
