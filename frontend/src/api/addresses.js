import API from "./axios";

// Customer: Get all saved addresses of logged-in user
export const getUserAddresses = () => API.get("/user/addresses/");

// Customer: Get address details by ID
export const getUserAddressById = (addressId) => API.get(`/user/addresses/${addressId}`);

// Customer: Create new address
export const createUserAddress = (addressData) =>
  API.post("/user/addresses/", addressData);

// Customer: Update address by ID
export const updateUserAddress = (addressId, addressData) =>
  API.put(`/user/addresses/${addressId}`, addressData);

// Customer: Delete address by ID
export const deleteUserAddress = (addressId) =>
  API.delete(`/user/addresses/${addressId}`);
