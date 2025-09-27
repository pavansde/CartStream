import React, { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function AdminPanel() {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, itemsRes, notificationsRes] = await Promise.all([
          API.get("/users/"),
          API.get("/admin/items"),
          API.get("/notifications"),
        ]);

        setUsers(usersRes.data);
        setLowStockItems(itemsRes.data.filter((i) => i.low_stock_alert));
        setNotifications(notificationsRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 403) {
          setErrMsg("Access denied — Admins only");
        } else if (err.response?.status === 401) {
          setErrMsg("Unauthorized. Please log in again.");
          logout();
        } else {
          setErrMsg("Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout]);

  const deleteUser = async (id) => {
    if (id === user.id) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete user.");
    }
  };

  const updateUserRole = async (id, newRole) => {
    try {
      await API.put(`/users/${id}`, { role: newRole });
      const res = await API.get("/users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Role update failed:", err.response?.data || err.message);
      alert(`Failed to update user role: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600 font-semibold">Loading data...</div>
    );
  }

  if (errMsg) {
    return <div className="p-6 text-center text-red-500 font-semibold">{errMsg}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Quick Navigation Buttons */}
      <div className="flex gap-4 mb-6">
        <a
          href="/admin/items"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Manage Items
        </a>
        <a
          href="/admin/orders"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          View Orders
        </a>
        <a
          href="/notifications"
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Notifications
        </a>
      </div>

      {/* Low Stock Items Summary */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-bold text-red-700 mb-2">
            Low Stock Items ({lowStockItems.length})
          </h3>
          <ul className="list-disc pl-5 text-sm max-h-40 overflow-auto">
            {lowStockItems.map((item) => (
              <li key={item.id}>
                {item.title} — Stock: {item.stock} (Owner: {item.owner_username})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Notifications */}
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <h3 className="font-bold text-gray-700 mb-2">Recent Notifications</h3>
        {notifications.length > 0 ? (
          <ul className="list-disc pl-5 text-sm max-h-40 overflow-auto">
            {notifications.map((n) => (
              <li key={n.id} className={n.is_read ? "text-gray-600" : "font-semibold"}>
                {n.message}{" "}
                {!n.is_read && <span className="text-xs text-red-500">(Unread)</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No notifications</p>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-white shadow-lg rounded-lg p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Admin Panel - User Management</h2>
        {users.length > 0 ? (
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 border-b">
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      className="border p-1 rounded"
                      disabled={u.id === user.id} // prevent self-role change
                      aria-label={`Change role for ${u.username}`}
                    >
                      <option value="customer">Customer</option>
                      <option value="ShopOwner">ShopOwner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-center">
                    {u.id !== user.id ? (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                        aria-label={`Delete user ${u.username}`}
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Cannot delete self</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
