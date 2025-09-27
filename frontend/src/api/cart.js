import API from "./axios";

// Fetch current user's cart items
export const getCartItems = (authToken) =>
  API.get("/cart", { headers: { Authorization: `Bearer ${authToken}` } });

// Add or update cart item
export const addOrUpdateCartItem = (data, authToken) =>
  API.post("/cart/items", data, { headers: { Authorization: `Bearer ${authToken}` } });

// Remove an item from cart
export const removeCartItem = (itemId, authToken) =>
  API.delete(`/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${authToken}` } });

// Clear entire cart
export const clearCart = (authToken) =>
  API.delete("/cart", { headers: { Authorization: `Bearer ${authToken}` } });
