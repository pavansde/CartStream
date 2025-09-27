import API from "./axios";

// Customer: Get my orders
export const getMyOrders = () => API.get("/orders/me");

// Customer: Create a new order (pass order data object)
export const createOrder = (orderData) => API.post("/orders/", orderData);

// Shop owner: Get all orders for their shop
export const getShopOwnerOrders = () => API.get("/shop-owner/orders");

// Admin: Get all orders (admin only)
export const getAdminOrders = () => API.get("/admin/orders");

// Admin: Update order status by order ID
export const updateOrderStatus = (orderId, statusData) =>
  API.put(`/admin/orders/${orderId}`, statusData);
