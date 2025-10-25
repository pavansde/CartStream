// import API from "./axios";

// // Fetch all categories
// export const getCategories = () =>
//   API.get("/categories");

// // Create a new category
// export const createCategory = (data, authToken) =>
//   API.post("/categories", data, { headers: { Authorization: `Bearer ${authToken}` } });

// // Update a category
// export const updateCategory = (categoryId, data, authToken) =>
//   API.put(`/categories/${categoryId}`, data, { headers: { Authorization: `Bearer ${authToken}` } });

// // Delete a category
// export const deleteCategory = (categoryId, authToken) =>
//   API.delete(`/categories/${categoryId}`, { headers: { Authorization: `Bearer ${authToken}` } });

// // Fetch categories for an item
// export const getItemCategories = (itemId) =>
//   API.get(`/items/${itemId}/categories`);

// // Add category to item
// export const addCategoryToItem = (itemId, categoryId, authToken) =>
//   API.post(`/items/${itemId}/categories/${categoryId}`, {}, { headers: { Authorization: `Bearer ${authToken}` } });

// // Remove category from item
// export const removeCategoryFromItem = (itemId, categoryId, authToken) =>
//   API.delete(`/items/${itemId}/categories/${categoryId}`, { headers: { Authorization: `Bearer ${authToken}` } });

// src/api/categories.js
import API from './axios';

// Get all categories
export const getCategories = () =>
  API.get('/categories/');

// Create a new category
export const createCategory = (categoryData) =>
  API.post('/categories/', categoryData);

// Get categories for a specific item
export const getItemCategories = (itemId) =>
  API.get(`/items/${itemId}/categories/`);  // Fixed: Added trailing slash to match backend

// Add category to an item
export const addCategoryToItem = (itemId, categoryId) =>
  API.post(`/items/${itemId}/categories/${categoryId}`);

// Remove category from an item
export const removeCategoryFromItem = (itemId, categoryId) =>
  API.delete(`/items/${itemId}/categories/${categoryId}`);