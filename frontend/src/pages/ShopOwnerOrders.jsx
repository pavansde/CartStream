import React, { useEffect, useState, useCallback } from "react";
import { getShopOwnerOrders, updateShopOwnerOrderStatus } from "../api/orders";

export default function ShopOwnerOrders({ orders: propOrders }) {
  const [internalOrders, setInternalOrders] = useState([]);
  const [orders, setOrders] = useState(propOrders || []);
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(!propOrders);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // // Memoized data fetching
  // const fetchOrders = useCallback(async () => {
  //   setLoading(true);
  //   setError("");
  //   try {
  //     const res = await getShopOwnerOrders();
  //     setOrders(res.data);
  //   } catch (err) {
  //     setError("Failed to load orders. Please try again.");
  //     console.error("Order fetch error:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchOrders();
  // }, [fetchOrders]);

  // Update orders when propOrders changes
  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
      setLoading(false);
    }
  }, [propOrders]);

  // Memoized data fetching - only run if no propOrders provided
  const fetchOrders = useCallback(async () => {
    if (propOrders) return; // Don't fetch if orders provided via props

    setLoading(true);
    setError("");
    try {
      const res = await getShopOwnerOrders();
      const ordersData = res.data;
      setOrders(ordersData);
      setInternalOrders(ordersData);
    } catch (err) {
      setError("Failed to load orders. Please try again.");
      console.error("Order fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [propOrders]);

  useEffect(() => {
    if (!propOrders) {
      fetchOrders();
    }
  }, [fetchOrders, propOrders]);

  useEffect(() => {
    if (!propOrders) {
      fetchOrders();
    }
  }, [fetchOrders, propOrders]);

  // Clear success message after delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // const handleStatusChange = async (orderId, newStatus) => {
  //   setUpdatingOrderId(orderId);
  //   setError("");
  //   setSuccessMessage("");

  //   try {
  //     await updateShopOwnerOrderStatus(orderId, { status: newStatus });
  //     setOrders((prev) =>
  //       prev.map((order) =>
  //         order.id === orderId ? { ...order, status: newStatus } : order
  //       )
  //     );
  //     setSuccessMessage(`Order #${orderId} status updated to ${newStatus}`);
  //   } catch (err) {
  //     setError("Failed to update order status. Please try again.");
  //     console.error("Status update error:", err);
  //   } finally {
  //     setUpdatingOrderId(null);
  //   }
  // };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setError("");
    setSuccessMessage("");

    try {
      await updateShopOwnerOrderStatus(orderId, { status: newStatus });
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      setInternalOrders(updatedOrders); // Also update internal orders if any
      setSuccessMessage(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      setError("Failed to update order status. Please try again.");
      console.error("Status update error:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        color: "bg-yellow-50 text-yellow-800 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        icon: "⏳"
      },
      processing: {
        color: "bg-blue-50 text-blue-800 border-blue-200",
        badge: "bg-blue-100 text-blue-800 border border-blue-200",
        icon: "🔄"
      },
      shipped: {
        color: "bg-purple-50 text-purple-800 border-purple-200",
        badge: "bg-purple-100 text-purple-800 border border-purple-200",
        icon: "🚚"
      },
      delivered: {
        color: "bg-green-50 text-green-800 border-green-200",
        badge: "bg-green-100 text-green-800 border border-green-200",
        icon: "✅"
      },
      cancelled: {
        color: "bg-red-50 text-red-800 border-red-200",
        badge: "bg-red-100 text-red-800 border border-red-200",
        icon: "❌"
      }
    };
    return config[status] || {
      color: "bg-gray-50 text-gray-800 border-gray-200",
      badge: "bg-gray-100 text-gray-800 border border-gray-200",
      icon: "📦"
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.shipping_address?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item =>
        item.item_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getTotalRevenue = () => {
    return filteredOrders
      .filter(order => order.status !== 'cancelled') // Exclude cancelled orders
      .reduce((total, order) => {
        const orderTotal = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;
        return total + orderTotal;
      }, 0);
  };
  // Enhanced loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage and track customer orders</p>
            </div>
            {/* <button
              onClick={fetchOrders}
              className="mt-4 sm:mt-0 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center"
            > */}
            {!propOrders && (
              <button
                onClick={fetchOrders}
                className="mt-4 sm:mt-0 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm flex items-center"
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalRevenue())}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600">🚚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {orders.filter(o => o.status === 'shipped').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <span className="text-red-500 mr-2 mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <span className="text-green-500 mr-2 mt-0.5">✅</span>
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-500 hover:text-green-700 ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by order ID, customer name, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {orders.length === 0 ? "No Orders Found" : "No Matching Orders"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {orders.length === 0
                ? "There are no orders to display at the moment. Orders will appear here when customers place them."
                : "No orders match your current search criteria. Try adjusting your filters."
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <div className="col-span-3">Order & Customer</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const orderTotal = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;

                return (
                  <div key={order.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4">
                      {/* Order ID & Customer */}
                      <div className="md:col-span-3">
                        <div className="flex items-start justify-between md:block">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">#{order.id}</p>
                            {order.order_date && (
                              <p className="text-sm text-gray-500 mt-1">
                                {formatDate(order.order_date)}
                              </p>
                            )}
                          </div>

                          {/* Mobile Status Badge */}
                          <div className="md:hidden mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.badge} flex items-center w-fit`}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="mt-3 text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">{order.shipping_address.full_name}</p>
                            <p className="text-xs">
                              {order.shipping_address.address_line1}
                              {order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''}
                            </p>
                            <p className="text-xs">
                              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                            </p>
                            <p className="text-xs">📞 {order.shipping_address.phone}</p>
                          </div>
                        )}
                      </div>

                      {/* Status - Desktop */}
                      <div className="hidden md:flex md:col-span-2 items-start">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.badge} flex items-center`}>
                          <span className="mr-2">{statusConfig.icon}</span>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="md:col-span-4">
                        <div className="space-y-3">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={item.id || index} className="flex items-center space-x-3 text-sm">
                              <img
                                src={item.image_url?.startsWith('http') ? item.image_url : `/${item.image_url}`}
                                alt={item.item_title || "Product image"}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-medium truncate">
                                  {item.item_title || "Unknown Item"}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Qty: {item.quantity} • {formatCurrency(item.line_total_price || 0)}
                                </p>
                              </div>
                            </div>
                          ))}

                          {order.items?.length > 3 && (
                            <p className="text-xs text-gray-500 font-medium">
                              +{order.items.length - 3} more items
                            </p>
                          )}

                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">
                              Order Total: {formatCurrency(orderTotal)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-3">
                        <div className="flex flex-col space-y-3">
                          <select
                            disabled={updatingOrderId === order.id}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${updatingOrderId === order.id
                              ? 'bg-gray-100 cursor-not-allowed opacity-70'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                              } ${statusConfig.color}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {updatingOrderId === order.id && (
                            <div className="flex items-center justify-center text-blue-600">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                              <span className="text-sm">Updating...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                <span className="mb-2 sm:mb-0">
                  Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}