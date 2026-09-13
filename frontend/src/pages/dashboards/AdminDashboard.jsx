import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Users" value={loading ? "-" : users.length} />
        <StatCard label="Departments" value={loading ? "-" : departments.length} />
        <StatCard label="Railway Sections" value={loading ? "-" : sections.length} />
        <StatCard label="Audit Entries" value={loading ? "-" : logs.length} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h2 className="font-medium text-slate-900 mb-3">Users</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
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
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4">{u.department?.name || "-"}</td>
                  <td className="py-2 pr-4">{u.isActive ? "Active" : "Inactive"}</td>
                  <td className="py-2 pr-4">
                    <button onClick={() => toggleActive(u)} className="text-xs text-blue-600 hover:underline">
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">System Activity</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {logs.slice(0, 20).map((log) => (
              <p key={log._id} className="text-xs text-slate-600">
                <span className="font-medium">{log.actor?.name}</span> {log.action} {log.entityType} -{" "}
                {new Date(log.createdAt).toLocaleString()}
              </p>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
