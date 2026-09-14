import { useEffect, useState } from "react";
import { notificationsApi } from "../api/resources";
import { Button } from "./ui";

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
    return <p className="text-sm text-steel">Loading notifications...</p>;
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-steel">No notifications yet.</p>;
  }

  return (
    <ul className="divide-y divide-hairline-soft">
      {notifications.map((n) => (
        <li key={n._id} className="flex items-start justify-between gap-3 py-2.5">
          <div>
            <p className={`text-sm ${n.read ? "text-steel" : "font-medium text-ink"}`}>{n.message}</p>
            <p className="text-xs text-stone">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.read && (
            <Button variant="link" size="xs" className="shrink-0" onClick={() => handleRead(n._id)}>
              Mark read
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
