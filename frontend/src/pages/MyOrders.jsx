import React, { useEffect, useState } from "react";
import { getMyOrders } from "../api/orders";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await getMyOrders();
        setOrders(res.data);
      } catch (err) {
        setError("Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading)
    return (
      <p className="p-6 text-center text-gray-500 animate-pulse">
        Loading your orders...
      </p>
    );
  if (error)
    return (
      <p className="p-6 text-center text-red-600 font-medium">{error}</p>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-800">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600 text-center mt-8">
          You have no orders placed yet.
        </p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 bg-white"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-700">
                  Order ID: <span className="font-normal">{order.id}</span>
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-gray-700 mb-1">Items:</p>
                <ul className="list-disc list-inside ml-4 space-y-3 text-gray-600">
                  {order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <li key={item.id ?? item.item_id ?? index} className="flex items-center space-x-4">
                        <img
                          src={item.image_url || item.image}
                          alt={item.item_title || "Product image"}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => { "Not Found"; }}
                        />
                        <div>
                          <div>{item.item_title || "Unknown item"} x {item.quantity}</div>
                          <div>₹{item.line_total_price != null ? item.line_total_price.toFixed(2) : "N/A"}</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>No items found</li>
                  )}
                </ul>

              </div>

              <p className="text-gray-800 font-semibold">
                Total:{" "}
                <span className="font-normal">
                  {order.total_price != null
                    ? `₹${order.total_price.toFixed(2)}`
                    : "N/A"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
