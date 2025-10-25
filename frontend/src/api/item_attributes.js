import API from "./axios";

// Fetch attributes for an item
export const getItemAttributes = (itemId) =>
  API.get(`/items/${itemId}/attributes/`);  // Fixed: Changed from /item-attributes/items/${itemId}

// Add attribute to an item
export const addItemAttribute = (itemId, data) =>
  API.post(`/items/${itemId}/attributes/`, data);  // Fixed: Added trailing slash, removed authToken

// Update an attribute
export const updateItemAttribute = (attributeId, data) =>
  API.put(`/attributes/${attributeId}`, data);  // Fixed: Changed from /item-attributes/attributes/${attributeId}

// Delete an attribute
export const deleteItemAttribute = (attributeId) =>
  API.delete(`/attributes/${attributeId}`);  // Fixed: Changed from /item-attributes/attributes/${attributeId}