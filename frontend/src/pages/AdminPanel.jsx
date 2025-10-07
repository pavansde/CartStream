import React, { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { updateOrderStatus } from "../api/orders";
import { getAdminCoupons, deleteAdminCoupon, toggleCouponStatus, createAdminCoupon, updateAdminCoupon } from "../api/coupons";
import CouponsTable from "../pages/Coupons"; // Import the Coupons component
import Sidebar from "../components/Sidebar";
import { updateItem } from "../api/items";
import AdminDashboardStats from "../components/AdminDashboardStats";

// Tab components (DashboardTab, UsersTab, OrdersTab, ItemsTab remain the same)

const DashboardTab = ({ users, items, orders, coupons }) => (
  <AdminDashboardStats
    users={users}
    items={items}
    orders={orders}
    coupons={coupons}
  />
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get unique shop owners from order items
  const getShopOwnersFromOrder = (order) => {
    if (!order.items || order.items.length === 0) return ['Unknown Shop'];

    // For now, we'll use the shop_owner_name from the order
    // But ideally, the API should provide shop owner per item
    if (order.shop_owner_name) {
      return [order.shop_owner_name];
    }

    return ['Multiple Shops']; // Fallback
  };

  // Function to group items by shop owner (for future when API provides this)
  const groupItemsByShopOwner = (items) => {
    const groups = {};
    items.forEach(item => {
      // Since API doesn't provide shop_owner per item, we'll group by item_id as placeholder
      const shopKey = item.shop_owner_name || `Shop-${item.item_id}`;
      if (!groups[shopKey]) {
        groups[shopKey] = [];
      }
      groups[shopKey].push(item);
    });
    return groups;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">All Orders</h2>
        <p className="text-gray-600 text-sm">Manage platform orders across all shops</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Owner(s)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const totalRevenue = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;
                const shopOwners = getShopOwnersFromOrder(order);
                const hasMultipleShops = shopOwners.length > 1;

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Order #{order.id}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Customer ID: {order.customer_id}
                        </div>
                        {order.customer_username && (
                          <div className="text-xs text-gray-500">
                            Username: {order.customer_username}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.shipping_address ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.shipping_address.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            📞 {order.shipping_address.phone}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.shipping_address.address_line1}
                            {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No shipping address</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {shopOwners.map((shopOwner, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-orange-600 text-xs">🏪</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {shopOwner}
                              </div>
                              {hasMultipleShops && (
                                <div className="text-xs text-gray-500">
                                  {order.items?.filter(item =>
                                    item.shop_owner_name === shopOwner ||
                                    !item.shop_owner_name
                                  ).length || 0} items
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {hasMultipleShops && (
                          <div className="text-xs text-blue-600 font-medium">
                            Multi-shop order
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {order.items?.slice(0, 3).map((item, index) => (
                          <div key={item.id || index} className="flex items-center justify-between text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium truncate">
                                {item.item_title || 'Unknown Item'}
                              </p>
                              <p className="text-gray-500 text-xs">
                                Qty: {item.quantity} × {formatCurrency((item.line_total_price || 0) / (item.quantity || 1))}
                              </p>
                            </div>
                            <span className="text-gray-900 font-medium ml-2">
                              {formatCurrency(item.line_total_price || 0)}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <div className="text-xs text-gray-500 pt-1">
                            +{order.items.length - 3} more items
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex justify-between text-xs font-medium text-gray-900">
                            <span>Total Items:</span>
                            <span>{totalItems}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(totalRevenue)}
                        </div>
                        {order.total_price && order.total_price !== totalRevenue && (
                          <div className="text-xs text-gray-500">
                            With shipping: {formatCurrency(order.total_price)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {order.items?.length || 0} product{order.items?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => onStatusChange(order.id, e.target.value)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${statusConfig.color}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
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

// const ItemsTab = ({ items, onDeleteItem, onEditItem }) => {
//   return (
//     <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//       <div className="px-6 py-4 border-b border-gray-200">
//         <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
//         <p className="text-gray-600 text-sm">Manage all items in the platform</p>
//       </div>

//       {items.length === 0 ? (
//         <div className="text-center py-12">
//           <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
//             <span className="text-2xl">✅</span>
//           </div>
//           <p className="text-gray-500">No items found</p>
//         </div>
//       ) : (
//         <table className="w-full table-auto border-collapse">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
//               <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {items.map(item => (
//               <tr key={item.id} className={item.low_stock_alert ? "bg-red-50" : ""}>
//                 <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
//                 <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
//                 <td className="px-6 py-4 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
//                 <td className={`px-6 py-4 text-sm ${item.low_stock_alert ? "text-red-600 font-semibold" : "text-gray-900"}`}>
//                   {item.stock}
//                   {item.low_stock_alert && <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">Low Stock</span>}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-900">{item.owner_username}</td>
//                 <td className="px-6 py-4 text-center space-x-2">
//                   <button
//                     onClick={() => onEditItem(item)}
//                     className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => onDeleteItem(item.id)}
//                     className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

const ItemsTab = ({
  items,
  onDeleteItem,
  onEditItem,
  editItemId,
  editForm,
  setEditForm,
  submitEdit,
  cancelEdit,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <p className="text-gray-600 text-sm">Manage all items in the platform</p>
      </div>

      {editItemId && (
        <form onSubmit={submitEdit} className="p-6 border-b border-gray-200 bg-gray-50 space-y-4 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold">Edit Item</h3>
          <input
            type="text"
            name="title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            name="price"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
            step="0.01"
            min="0"
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            name="stock"
            value={editForm.stock}
            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
            min="0"
            required
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setEditForm({ ...editForm, imageFile: e.target.files[0] })}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between">
            <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      )}

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
            {items.map((item) => (
              <tr key={item.id} className={item.low_stock_alert ? "bg-red-50" : ""}>
                {/* Cell values same as before */}
                <td className="px-6 py-4">
                  {item.image_url ? (
                    <img
                      src={`http://localhost:8000${item.image_url}`}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                      No Image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                <td className="px-6 py-4 text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                <td className={`px-6 py-4 text-sm ${item.low_stock_alert ? "text-red-600 font-semibold" : "text-gray-900"}`}>
                  {item.stock}
                  {item.low_stock_alert && <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">Low Stock</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.owner_username}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => onEditItem(item)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                    Edit
                  </button>
                  <button onClick={() => onDeleteItem(item.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">
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
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  // Coupon editing state
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // item editing state
  const [editItemId, setEditItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    imageFile: null,
  });


  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "items", label: "Manage Items", icon: "📦" },
    { id: "promotions", label: "Promotions", icon: "🎫" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, itemsRes, notificationsRes, couponsRes] = await Promise.all([
          API.get("/users/"),
          API.get("/admin/items"),
          API.get("/notifications"),
          getAdminCoupons() // Use the API function
        ]);

        setUsers(usersRes.data);
        setItems(itemsRes.data);
        setLowStockItems(itemsRes.data.filter(i => i.low_stock_alert));
        setNotifications(notificationsRes.data.slice(0, 5));
        setCoupons(couponsRes.data);
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
    setEditItemId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      price: item.price,
      stock: item.stock,
      imageFile: null,
    });
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditForm({
      title: '',
      description: '',
      price: 0,
      stock: 0,
      imageFile: null,
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("price", editForm.price);
      formData.append("stock", editForm.stock);

      if (editForm.imageFile) {
        formData.append("image", editForm.imageFile);
      }

      const res = await updateItem(editItemId, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      let updatedImageUrl = editForm.imageUrl;
      if (editForm.imageFile && res.data.image_url) {
        updatedImageUrl = `${res.data.image_url}?t=${new Date().getTime()}`;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editItemId ? { ...item, ...editForm, image_url: updatedImageUrl } : item
        )
      );
      cancelEdit();
      setErrMsg("");
    } catch (err) {
      console.error("Update failed:", err);
      setErrMsg("Failed to update item.");
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
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

  // Updated Coupon handlers for admin
  const handleAddCoupon = async (couponData) => {
    try {
      const response = await createAdminCoupon(couponData);
      setCoupons(prev => [...prev, response.data]);
    } catch (err) {
      alert("Failed to create coupon");
      console.error(err);
    }
  };

  const handleEditCoupon = (coupon) => {
    // Convert the coupon to the form format and set editing state
    const formattedCoupon = {
      ...coupon,
      start_at: coupon.start_at ? coupon.start_at.split('T')[0] : '',
      end_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '', // Note: admin uses expires_at
      min_order_amount: coupon.min_order_amount || '',
      max_uses: coupon.usage_limit || '', // Note: admin uses usage_limit
      discount_value: coupon.discount_value ? coupon.discount_value.toString() : '',
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      active: coupon.active !== undefined ? coupon.active : true, // Note: admin uses is_active
    };
    setEditingCoupon(formattedCoupon);
  };

  const handleEditFormChange = (field, value) => {
    setEditingCoupon(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (couponData) => {
    try {
      // Validate required fields
      if (!couponData.code?.trim()) {
        alert("Coupon code is required");
        return;
      }
      if (!couponData.discount_value || Number(couponData.discount_value) <= 0) {
        alert("Discount value should be greater than zero");
        return;
      }

      const payload = {
        code: couponData.code,
        description: couponData.description,
        discount_type: couponData.discount_type,
        discount_value: parseFloat(couponData.discount_value),
        min_order_amount: couponData.min_order_amount ? parseFloat(couponData.min_order_amount) : 0,
        usage_limit: couponData.max_uses ? parseInt(couponData.max_uses) : null, // Note: admin uses usage_limit
        expires_at: couponData.end_at ? new Date(couponData.end_at).toISOString() : null, // Note: admin uses expires_at
        is_active: couponData.active // Note: admin uses is_active
      };

      const response = await updateAdminCoupon(editingCoupon.id, payload);
      setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? { ...c, ...response.data } : c)));
      setEditingCoupon(null);
    } catch (err) {
      alert("Failed to update coupon");
      console.error(err);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      await toggleCouponStatus(couponId);
      setCoupons(prev => prev.map(c =>
        c.id === couponId ? { ...c, active: !c.active } : c // Note: admin uses is_active
      ));
    } catch (err) {
      alert("Failed to toggle coupon");
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteAdminCoupon(couponId);
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    } catch (err) {
      alert("Failed to delete coupon");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingCoupon(null);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab users={users} lowStockItems={lowStockItems} notifications={notifications} orders={orders} coupons={coupons} />;
      case "users":
        return <UsersTab users={users} user={user} updateUserRole={updateUserRole} deleteUser={deleteUser} />;
      case "orders":
        return <OrdersTab orders={orders} ordersLoading={ordersLoading} ordersError={ordersError} onStatusChange={handleStatusChange} />;
      case "items":
        return (
          <ItemsTab
            items={items}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            editItemId={editItemId}
            editForm={editForm}
            setEditForm={setEditForm}
            submitEdit={submitEdit}
            cancelEdit={cancelEdit}
          />
        );
      case "promotions":
        return (
          <CouponsTable
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onEditCoupon={handleEditCoupon}
            onToggleCoupon={handleToggleCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            loading={loading}
            error={errMsg}
            editingCoupon={editingCoupon}
            onCancelEdit={handleCancelEdit}
            onEditFormChange={handleEditFormChange}
            onEditSubmit={handleEditSubmit}
          />
        );
      default:
        return <DashboardTab users={users} lowStockItems={lowStockItems} notifications={notifications} orders={orders} coupons={coupons} />;
    }
  };

  // ... rest of the component (loading, error, and return JSX remains the same)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          title="Admin Dashboard"
          subtitle="Platform Management"
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          user={user}
          userColor="blue"
          userRoleLabel="Administrator"
        />

        {/* Main content */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-2">
                {activeTab === 'dashboard' && 'Manage users, orders, and platform operations'}
                {activeTab === 'users' && 'Manage user roles and permissions'}
                {activeTab === 'orders' && 'Manage platform orders'}
                {activeTab === 'items' && 'Manage all items in the platform'}
                {activeTab === 'promotions' && 'Manage discount codes and promotions'}
              </p>
            </div>

            {/* Tab Content */}
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
}