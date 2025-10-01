import React, { useEffect, useState } from "react";
import { getShopOwnerOrders, updateShopOwnerOrderStatus } from "../api/orders";

export default function ShopOwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getShopOwnerOrders();
        setOrders(res.data);
      } catch (err) {
        setError("Failed to load orders. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateShopOwnerOrderStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      setError("Failed to update order status. Please try again.");
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", badge: "bg-yellow-100 text-yellow-800" },
      processing: { color: "bg-blue-50 text-blue-700 border-blue-200", badge: "bg-blue-100 text-blue-800" },
      shipped: { color: "bg-purple-50 text-purple-700 border-purple-200", badge: "bg-purple-100 text-purple-800" },
      delivered: { color: "bg-green-50 text-green-700 border-green-200", badge: "bg-green-100 text-green-800" },
      cancelled: { color: "bg-red-50 text-red-700 border-red-200", badge: "bg-red-100 text-red-800" }
    };
    return config[status] || { color: "bg-gray-50 text-gray-700 border-gray-200", badge: "bg-gray-100 text-gray-800" };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-80 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Orders</h3>
            <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Manage and update customer orders</p>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">There are no orders to display at the moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase tracking-wider">
              <div className="col-span-2">Order ID</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Items</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <div key={order.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Order ID */}
                    <div className="col-span-2 flex items-center">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.id}</p>
                        {order.order_date && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.order_date)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="col-span-4">
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item, index) => (
                          <div key={item.id || index} className="flex items-center justify-between text-sm space-x-4">
                            {/* Product image */}
                            <img
                              src={item.image_url.startsWith('http') ? item.image_url : `/${item.image_url}`}
                              alt={item.item_title || "Product image"}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/api/placeholder/50/50";
                              }}
                            />
                            {/* Item title and quantity */}
                            <span className="flex-grow text-gray-900 truncate">
                              {item.item_title || "Unknown Item"} × {item.quantity}
                            </span>
                            {/* Item price */}
                            <span className="text-gray-500 font-medium">
                              ₹{item.line_total_price?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-gray-500 mt-1">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                        {order.items?.length === 0 && (
                          <p className="text-gray-500 text-sm">No items</p>
                        )}
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center">
                      <select
                        disabled={updatingOrderId === order.id}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${updatingOrderId === order.id
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
                        <div className="ml-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Showing {orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}