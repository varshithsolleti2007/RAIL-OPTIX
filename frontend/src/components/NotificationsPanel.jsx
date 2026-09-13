import { useEffect, useState } from "react";
import { notificationsApi } from "../api/resources";

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { notifications } = await notificationsApi.list();
      setNotifications(notifications);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRead(id) {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading notifications...</p>;
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-slate-500">No notifications yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {notifications.map((n) => (
        <li key={n._id} className="py-2 flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm ${n.read ? "text-slate-500" : "text-slate-900 font-medium"}`}>{n.message}</p>
            <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.read && (
            <button
              onClick={() => handleRead(n._id)}
              className="text-xs text-blue-600 hover:underline shrink-0"
            >
              Mark read
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
