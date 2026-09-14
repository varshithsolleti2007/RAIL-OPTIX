import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Badge, Button, Card, StatTile } from "../../components/ui";
import { auditApi, departmentsApi, sectionsApi, usersApi } from "../../api/resources";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, d, s, a] = await Promise.all([
        usersApi.list(),
        departmentsApi.list(),
        sectionsApi.list(),
        auditApi.list(),
      ]);
      setUsers(u.users);
      setDepartments(d.departments);
      setSections(s.sections);
      setLogs(a.logs);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleActive(user) {
    const { user: updated } = await usersApi.setActive(user._id, !user.isActive);
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Users" value={loading ? "-" : users.length} tone="base" />
        <StatTile label="Departments" value={loading ? "-" : departments.length} tone="yellow" />
        <StatTile label="Railway Sections" value={loading ? "-" : sections.length} tone="teal" />
        <StatTile label="Audit Entries" value={loading ? "-" : logs.length} tone="rose" />
      </div>

      <Card padding="md" className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ink">Users</h2>
        {loading ? (
          <p className="text-sm text-steel">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-steel">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-hairline-soft">
                    <td className="py-2 pr-4 font-medium text-ink">{u.name}</td>
                    <td className="py-2 pr-4 text-slate">{u.email}</td>
                    <td className="py-2 pr-4 text-slate">{u.role}</td>
                    <td className="py-2 pr-4 text-slate">{u.department?.name || "-"}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="py-2 pr-4">
                      <Button variant="link" size="xs" onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-base font-semibold text-ink">System Activity</h2>
        {loading ? (
          <p className="text-sm text-steel">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-steel">No activity recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {logs.slice(0, 20).map((log) => (
              <p key={log._id} className="text-xs text-slate">
                <span className="font-medium text-ink">{log.actor?.name}</span> {log.action} {log.entityType} -{" "}
                {new Date(log.createdAt).toLocaleString()}
              </p>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
