import API from "./axios";

// Publicly available items
export const getAllItems = () => API.get("/items/");

// Fetch items for the current shop owner
export const getMyItems = () => API.get("/items/mine");

// Create a new item (shop owner)
export const createItem = (data) => API.post("/items/", data);

// Delete an item by ID (shop owner)
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Update an item by ID (shop owner/admin)
export const updateItem = (id, data) => API.put(`/items/${id}`, data);

// Admin-only: Get all items with owner info and low stock flag
export const adminGetAllItems = () => API.get("/admin/items");

// Admin-only: Delete any item by ID
export const adminDeleteItem = (id) => API.delete(`/admin/items/${id}`);
