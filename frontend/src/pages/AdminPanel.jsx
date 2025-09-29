import React, { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { updateOrderStatus } from "../api/orders";


// Tab components
const DashboardTab = ({ users, lowStockItems, notifications, orders }) => (
  <div className="space-y-6">
    {/* Quick Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-lg font-semibold text-gray-900">{users.length} Users</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <p className="text-lg font-semibold text-gray-900">{orders.length} Orders</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Low Stock</p>
            <p className="text-lg font-semibold text-gray-900">{lowStockItems.length} Items</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
            <span className="text-xl">🔔</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Notifications</p>
            <p className="text-lg font-semibold text-gray-900">{notifications.length} New</p>
          </div>
        </div>
      </div>
    </div>

    {/* Alerts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600">⚠️</span>
            </div>
            <h3 className="font-bold text-red-700">Low Stock Items ({lowStockItems.length})</h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-auto">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg">
                <span className="font-medium text-gray-900 truncate">{item.title}</span>
                <div className="flex items-center gap-4">
                  <span className="text-red-600 font-semibold">Stock: {item.stock}</span>
                  <span className="text-gray-500 text-xs">Owner: {item.owner_username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600">🔔</span>
          </div>
          <h3 className="font-bold text-gray-900">Recent Notifications</h3>
        </div>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className="text-sm text-gray-700">{n.message}</p>
                {!n.is_read && <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Unread</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No notifications</p>
        )}
      </div>
    </div>
  </div>
);

const UsersTab = ({ users, user, updateUserRole, deleteUser }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900">User Management</h2>
      <p className="text-gray-600 text-sm">Manage user roles and permissions</p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm font-medium">
                      {u.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.username}</div>
                    <div className="text-sm text-gray-500">ID: {u.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{u.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={u.role}
                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                  className={`text-sm border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${u.id === user.id ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                  disabled={u.id === user.id}
                >
                  <option value="customer">Customer</option>
                  <option value="ShopOwner">Shop Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {u.id !== user.id ? (
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">Current user</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const OrdersTab = ({ orders, ordersLoading, ordersError, onStatusChange }) => {
  const getStatusConfig = (status) => {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
      processing: { color: "bg-blue-100 text-blue-800", icon: "⚙️" },
      shipped: { color: "bg-purple-100 text-purple-800", icon: "🚚" },
      delivered: { color: "bg-green-100 text-green-800", icon: "✅" },
      cancelled: { color: "bg-red-100 text-red-800", icon: "❌" }
    };
    return config[status] || { color: "bg-gray-100 text-gray-800", icon: "●" };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
        <p className="text-gray-600 text-sm">Manage platform orders</p>
      </div>

      {ordersLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading orders...</p>
        </div>
      ) : ordersError ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-red-600">{ordersError}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Order #{order.id}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </div>
                        {order.items?.slice(0, 2).map((item, index) => (
                          <div key={item.id || index} className="text-xs text-gray-600 truncate">
                            • {item.item_title} × {item.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.customer_username}</div>
                      <div className="text-xs text-gray-500">ID: {order.customer_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.shop_owner_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{order.total_price?.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        className={`rounded border px-2 py-1 text-sm ${statusConfig.color}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// const ItemsTab = ({ items }) => (
//   <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//     <div className="px-6 py-4 border-b border-gray-200">
//       <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
//       <p className="text-gray-600 text-sm">Manage all items in the platform</p>
//     </div>

//     {items.length === 0 ? (
//       <div className="text-center py-12">
//         <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
//           <span className="text-2xl">✅</span>
//         </div>
//         <p className="text-gray-500">No items found</p>
//       </div>
//     ) : (
//       <table className="w-full table-auto border-collapse">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-200">
//           {items.map((item) => (
//             <tr key={item.id} className={item.low_stock_alert ? "bg-red-50" : ""}>
//               <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
//               <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
//               <td className="px-6 py-4 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
//               <td className={`px-6 py-4 text-sm ${item.low_stock_alert ? "text-red-600 font-semibold" : "text-gray-900"}`}>
//                 {item.stock}
//                 {item.low_stock_alert && <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">Low Stock</span>}
//               </td>
//               <td className="px-6 py-4 text-sm text-gray-900">{item.owner_username}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     )}
//   </div>
// );

const ItemsTab = ({ items, onDeleteItem, onEditItem }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <p className="text-gray-600 text-sm">Manage all items in the platform</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-gray-500">No items found</p>
        </div>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className={item.low_stock_alert ? "bg-red-50" : ""}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                <td className="px-6 py-4 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                <td className={`px-6 py-4 text-sm ${item.low_stock_alert ? "text-red-600 font-semibold" : "text-gray-900"}`}>
                  {item.stock}
                  {item.low_stock_alert && <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">Low Stock</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.owner_username}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button
                    onClick={() => onEditItem(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};


export default function AdminPanel() {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, itemsRes, notificationsRes] = await Promise.all([
          API.get("/users/"),
          API.get("/admin/items"),
          API.get("/notifications"),
        ]);

        setUsers(usersRes.data);
        setItems(itemsRes.data); // full list of items
        setLowStockItems(itemsRes.data.filter(i => i.low_stock_alert)); // low stock subset

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

    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await API.get("/admin/orders");
        setOrders(res.data);
      } catch (err) {
        setOrdersError("Failed to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchData();
    fetchOrders();
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

  const onDeleteItem = async (itemId) => {
  if (!window.confirm("Are you sure you want to delete this item?")) return;
  try {
    await API.delete(`/admin/items/${itemId}`);
    setItems(prev => prev.filter(i => i.id !== itemId));
    alert("Item deleted successfully");
  } catch (err) {
    alert("Delete failed");
    console.error(err);
  }
};

const onEditItem = (item) => {
  // Show an edit modal or navigate to edit page with item data
  alert(`Implement edit UI for item: ${item.title}`);
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      // Update local state to reflect status change
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert("Failed to update order status.");
      console.error(err);
    }
  };


  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "items", label: "Manage Items", icon: "📦" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{errMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab users={users} lowStockItems={lowStockItems} notifications={notifications} orders={orders} />;
      case "users":
        return <UsersTab users={users} user={user} updateUserRole={updateUserRole} deleteUser={deleteUser} />;
      case "orders":
        return (
          <OrdersTab
            orders={orders}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            onStatusChange={handleStatusChange}  // <-- Pass the function here
          />
        );
      case "items":
          return <ItemsTab items={items} onDeleteItem={onDeleteItem} onEditItem={onEditItem} />;
      default:
        return <DashboardTab users={users} lowStockItems={lowStockItems} notifications={notifications} orders={orders} />;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, orders, and platform operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderActiveTab()}
      </div>
    </div>
  );
}