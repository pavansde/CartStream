import API from "./axios";

// Customer: Get my orders
export const getMyOrders = () => API.get("/orders/me");

// Customer: Create a new order (pass order data object)
export const createOrder = (orderData) => API.post("/orders/", orderData);

// Shop owner: Get all orders for their shop
export const getShopOwnerOrders = () => API.get("/shop-owner/orders");

// shop owner update order status
export const updateShopOwnerOrderStatus = (orderId, statusData) =>
  API.put(`/shop-owner/orders/${orderId}/status`, statusData);

// Admin: Get all orders (admin only)
export const getAdminOrders = () => API.get("/admin/orders");

// Admin: Update order status by order ID
export const updateOrderStatus = (orderId, statusData) =>
  API.put(`/admin/orders/${orderId}`, statusData);

// Customer: Get order invoice
export const getOrderInvoice = (orderId) => API.get(`/orders/${orderId}/invoice`);

// PhonePe payment initiation - call backend to start PhonePe payment
export const initiatePhonePePayment = (paymentData) =>
  API.post("/payment/phonepe/initiate", paymentData);


// Optionally, if you want to provide polling/check status endpoint
export const checkPhonePePaymentStatus = (transactionId) =>
  API.get(`/payment/phonepe/status/${transactionId}`);
