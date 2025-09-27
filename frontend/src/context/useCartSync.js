import { useEffect, useContext } from "react";
import API from "../api/axios"; // import your configured axios instance
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

export function useCartSync() {
  const { user, authToken } = useContext(AuthContext);
  const { setCart } = useContext(CartContext);

  useEffect(() => {
    async function syncCart() {
      if (!user || !authToken || !setCart) return;

      try {
        const guestCart = JSON.parse(localStorage.getItem("cart") || "{}");
        const res = await API.get("/cart/", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const userCart = res.data || {};

        const mergedCart = { ...userCart };
        Object.entries(guestCart).forEach(([itemId, qty]) => {
          mergedCart[itemId] = (mergedCart[itemId] || 0) + qty;
        });

        await API.put("/cart", mergedCart, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        setCart(mergedCart);
        localStorage.removeItem("cart");
      } catch (err) {
        console.error("Failed to sync cart after login:", err);
      }
    }
    syncCart();
  }, [user, authToken, setCart]);
}
