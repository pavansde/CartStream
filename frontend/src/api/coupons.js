import API from "./axios";

// Public: Get active coupons (optionally pass query params)
export const getActiveCoupons = (params = {}) => API.get("/coupons/", { params });

// Public: Get coupon details by code
export const getCouponByCode = (code) => API.get(`/coupons/${code}`);

// Customer: Redeem/validate a coupon for an order total
export const redeemCoupon = (code, orderTotal) =>
  API.post("/coupons/redeem", {}, { params: { code, order_total: orderTotal } });

// shop owner: Get all coupons
export const getShopOwnerCoupons = () => API.get("/shop-owner/coupons");

// Shop Owner: Create a coupon
export const createShopOwnerCoupon = (couponData) =>
  API.post("/shop-owner/coupons/", couponData);

// Shop Owner: Update own coupon by ID
export const updateShopOwnerCoupon = (couponId, couponData) =>
  API.put(`/shop-owner/coupons/${couponId}`, couponData);

// Shop Owner: Delete own coupon by ID
export const deleteShopOwnerCoupon = (couponId) =>
  API.delete(`/shop-owner/coupons/${couponId}`);

// shop owner: Toggle coupon active status by ID
export const toggleShopOwnerCouponStatus = (couponId) =>
  API.patch(`/shop-owner/coupons/${couponId}/toggle`);

// Admin: Get all coupons
export const getAdminCoupons = () => API.get("/admin/coupons");

// Admin: Create coupon
export const createAdminCoupon = (couponData) =>
  API.post("/admin/coupons/", couponData);

// Admin: Update coupon by ID
export const updateAdminCoupon = (couponId, couponData) =>
  API.put(`/admin/coupons/${couponId}`, couponData);

// Admin: Toggle coupon active status by ID
export const toggleCouponStatus = (couponId) =>
  API.patch(`/admin/coupons/${couponId}/toggle`);

// Admin: Delete coupon by ID
export const deleteAdminCoupon = (couponId) =>
  API.delete(`/admin/coupons/${couponId}`);
