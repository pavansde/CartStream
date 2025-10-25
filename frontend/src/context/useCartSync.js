import { useEffect, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

export function useCartSync() {
  const { user, authToken } = useContext(AuthContext);
  const { setCart } = useContext(CartContext);

  useEffect(() => {
    async function syncCart() {
      if (!user || !authToken || !setCart) return;

      try {
        // Get guest cart
        const guestCart = JSON.parse(localStorage.getItem("cart") || "{}");
        
        // Get user cart from backend
        const res = await API.get("/cart/", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const userCart = res.data || {};

        // Convert both carts to array format for easier merging
        const guestCartItems = Object.entries(guestCart).map(([key, data]) => ({
          itemId: key,
          quantity: typeof data === 'object' ? data.quantity : data,
          variant: typeof data === 'object' ? data.variant : null
        }));

        const userCartItems = Object.entries(userCart).map(([key, data]) => ({
          itemId: key,
          quantity: typeof data === 'object' ? data.quantity : data,
          variant: typeof data === 'object' ? data.variant : null
        }));

        // Merge strategy: prefer guest cart variants when they exist
        const mergedItems = [...userCartItems];
        
        guestCartItems.forEach(guestItem => {
          const existingIndex = mergedItems.findIndex(userItem => 
            userItem.itemId === guestItem.itemId && 
            JSON.stringify(userItem.variant) === JSON.stringify(guestItem.variant)
          );

          if (existingIndex >= 0) {
            // Same item + variant combination - add quantities
            mergedItems[existingIndex].quantity += guestItem.quantity;
          } else {
            // Different variant or new item - add as new entry
            mergedItems.push(guestItem);
          }
        });

        // Convert back to object format
        const mergedCart = {};
        mergedItems.forEach(item => {
          mergedCart[item.itemId] = {
            quantity: item.quantity,
            variant: item.variant
          };
        });

        // Update backend (you might need to update your backend API to handle variants)
        // For now, we'll send just the quantities
        const cartForBackend = {};
        mergedItems.forEach(item => {
          cartForBackend[item.itemId] = item.quantity;
        });

        await API.put("/cart", cartForBackend, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        // Update local state
        setCart(mergedCart);
        localStorage.removeItem("cart");
        
        // console.log("Cart sync completed with variant awareness");
      } catch (err) {
        console.error("Failed to sync cart after login:", err);
      }
    }
    
    syncCart();
  }, [user, authToken, setCart]);
}