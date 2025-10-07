import API from "./axios";

// ===== User Profile Routes =====

// Get current user's profile (extended fields)
export const getUserProfile = (authToken) =>
  API.get("/me/profile", { headers: { Authorization: `Bearer ${authToken}` } });

// Update current user's profile (extended fields)
export const updateUserProfile = (profileData, authToken) =>
  API.put("/me/profile", profileData, { headers: { Authorization: `Bearer ${authToken}` } });

// ===== User Routes =====

// Get current user 
export const getCurrentUser = (authToken) =>
  API.get("/me", { headers: { Authorization: `Bearer ${authToken}` } });

// Update current user
export const updateCurrentUser = (userData, authToken) =>
  API.put("/me", userData, { headers: { Authorization: `Bearer ${authToken}` } });

// Change password while signed in
export const changePassword = (passwordData, authToken) =>
  API.put("/me/password", passwordData, { headers: { Authorization: `Bearer ${authToken}` } });

// Register new user
export const registerUser = (userData) =>
  API.post("/users/", userData);

// Login user
export const loginUser = (credentials) =>
  API.post("/login/", credentials);

// Admin: List all users
export const listUsers = (authToken) =>
  API.get("/users/", { headers: { Authorization: `Bearer ${authToken}` } });

// Admin: Update user by ID
export const updateUser = (userId, userData, authToken) =>
  API.put(`/users/${userId}`, userData, { headers: { Authorization: `Bearer ${authToken}` } });

// Admin: Delete user by ID
export const deleteUser = (userId, authToken) =>
  API.delete(`/users/${userId}`, { headers: { Authorization: `Bearer ${authToken}` } });

// Forgot password request
export const forgotPassword = (email) =>
  API.post("/forgot-password", { email });

// Reset password using token
export const resetPassword = (token, newPassword) =>
  API.post("/reset-password", { token, new_password: newPassword });
