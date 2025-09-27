import API from "./axios";

// Get current user's wishlist items
export const getMyWishlist = () => API.get("/wishlist/");

// Add an item to wishlist (item ID in body)
export const addToWishlist = (itemId) => API.post("/wishlist/", { item_id: itemId });

// Remove an item from wishlist by item ID
export const removeFromWishlist = (itemId) => API.delete(`/wishlist/${itemId}`);
