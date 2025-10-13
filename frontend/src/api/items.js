import API from "./axios";

// Publicly available items
export const getAllItems = () => API.get("/items/");

// Fetch a single item's details by ID (public)
export const getItemById = (id) => API.get(`/items/${id}/detail`);

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

// =====================
// Product Variant Routes
// =====================

// Create a new variant for a given item (supports multiple images)
export const createVariant = (itemId, data) =>
  API.post(`/items/${itemId}/variants/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Update an existing variant by variant ID (supports adding more images)
export const updateVariant = (variantId, data) =>
  API.put(`/variants/${variantId}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Delete a variant by variant ID
export const deleteVariant = (variantId) => API.delete(`/variants/${variantId}`);

// =====================
// Variant Image Management Routes
// =====================

// Get all images for a specific variant
export const getVariantImages = (variantId) =>
  API.get(`/variants/${variantId}/images`);

// Add more images to an existing variant
export const addVariantImages = (variantId, data) =>
  API.post(`/variants/${variantId}/images`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Delete a specific variant image
export const deleteVariantImage = (imageId) =>
  API.delete(`/variant-images/${imageId}`);

// =====================
// Enhanced Item Queries
// =====================

// Get item with complete variant and image data
export const getItemWithVariants = (itemId) =>
  API.get(`/items/${itemId}`);