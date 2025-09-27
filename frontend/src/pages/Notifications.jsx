import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";


export default function Notifications() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead
  } = useContext(AuthContext);

  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    // Make sure we have fresh notifications on load
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
  setMarkingAll(true);
  try {
    await API.put("/notifications/mark-all-read");
    // Optimistically update UI state
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  } catch (err) {
    console.error("Mark all read failed:", err);
  } finally {
    setMarkingAll(false);
  }
};


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 shadow rounded max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Notifications</h1>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className={`px-3 py-1 text-sm rounded ${
                markingAll
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {markingAll ? "Marking..." : "Mark All as Read"}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`p-4 flex justify-between items-start ${
                  !n.is_read ? "bg-yellow-50" : "bg-white"
                }`}
              >
                <div>
                  <p
                    className={`${
                      !n.is_read ? "font-semibold" : "text-gray-600"
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="ml-4 text-xs px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Mark Read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
