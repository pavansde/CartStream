import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from "react";
import { AuthContext } from "./AuthContext";
import {
  getCartItems,
  addOrUpdateCartItem,
  removeCartItem,
  clearCart as clearCartAPI,
} from "../api/cart";
import { getAllItems } from "../api/items";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, authToken } = useContext(AuthContext);

  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [loadingIds, setLoadingIds] = useState(new Set());

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

//   const addItem = useCallback(async (itemId) => {
//   console.log("addItem called with:", itemId);
//   setLoadingIds((prev) => new Set(prev).add(itemId));
//   const newQty = (cart[itemId] || 0) + 1;
//   setCart((prev) => ({ ...prev, [itemId]: newQty }));

//   if (user && authToken) {
//     console.log("Calling addOrUpdateCartItem API");
//     try {
//       await addOrUpdateCartItem({ item_id: itemId, quantity: newQty }, authToken);
//       console.log("Cart updated successfully");
//     } catch (err) {
//       console.error("Failed to update backend cart", err);
//     }
//   }

//   setLoadingIds((prev) => {
//     const copy = new Set(prev);
//     copy.delete(itemId);
//     return copy;
//   });
// }, [user, authToken, cart]);

// Replace your current addItem function with this:
const addItem = useCallback(async (itemId, quantityToAdd = 1) => {
  console.log("addItem called with:", itemId, "quantity:", quantityToAdd);
  setLoadingIds((prev) => new Set(prev).add(itemId));
  
  setCart((prevCart) => {
    const currentQty = prevCart[itemId] || 0;
    const newQty = currentQty + quantityToAdd;
    const newCart = { ...prevCart, [itemId]: newQty };
    
    // Make API call with the updated quantity
    if (user && authToken) {
      console.log("Calling addOrUpdateCartItem API with quantity:", newQty);
      addOrUpdateCartItem({ item_id: itemId, quantity: newQty }, authToken)
        .then(() => console.log("Cart updated successfully"))
        .catch(err => console.error("Failed to update backend cart", err));
    }
    
    return newCart;
  });

  setLoadingIds((prev) => {
    const copy = new Set(prev);
    copy.delete(itemId);
    return copy;
  });
}, [user, authToken]);

// Fetch cart items from backend or local
  const fetchCartItems = useCallback(async () => {
    if (!user || !authToken) {
    // Fetch all items once
    const response = await getAllItems();
    const allItems = response.data; // assume array of item objects
    // Get IDs and quantities from localStorage cart
    const cartEntries = Object.entries(cart);
    // Map cart entries to full item details + quantity
    const cartItems = cartEntries.map(([itemId, quantity]) => {
      const item = allItems.find((i) => i.id === Number(itemId));
      return item ? { id: itemId, item, quantity } : null;
    }).filter(Boolean);
    return cartItems;
  }
    try {
      const response = await getCartItems(authToken);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch backend cart items", err);
      return Object.entries(cart).map(([itemId, quantity]) => ({
        item_id: Number(itemId),
        quantity,
      }));
    }
  }, [user, authToken, cart]);

  const clearCart = useCallback(async () => {
    setCart({});

    if (user && authToken) {
      try {
        await clearCartAPI(authToken);
      } catch (err) {
        console.error("Failed to clear backend cart", err);
      }
    }
  }, [user, authToken]);


  const removeItem = useCallback(
  async (itemId) => {
    setLoadingIds((prev) => new Set(prev).add(itemId));

    // Optimistically update local state by removing the item
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });

    if (user && authToken) {
      try {
        await removeCartItem(itemId, authToken);
        // Optionally, refetch backend cart to ensure sync
        const freshCartItems = await fetchCartItems();
        const newCartState = {};
        freshCartItems.forEach(item => {
          newCartState[item.item.id] = item.quantity;
        });
        setCart(newCartState);
      } catch (err) {
        console.error("Failed to remove item from backend cart", err);
        // Rollback optimistic update if needed
      }
    }

    setLoadingIds((prev) => {
      const copy = new Set(prev);
      copy.delete(itemId);
      return copy;
    });
  },
  [user, authToken, fetchCartItems]
);


  const updateItemQuantity = useCallback(
    async (itemId, quantity) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setLoadingIds((prev) => new Set(prev).add(itemId));
      setCart((prev) => ({ ...prev, [itemId]: quantity }));

      if (user && authToken) {
        try {
          await addOrUpdateCartItem({ item_id: itemId, quantity }, authToken);
        } catch (err) {
          console.error("Failed to update backend cart", err);
        }
      }

      setLoadingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(itemId);
        return copy;
      });
    },
    [user, authToken, removeItem]
  );

  

  const value = useMemo(
    () => ({
      cart,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      loadingIds,
      fetchCartItems,
    }),
    [cart, addItem, updateItemQuantity, removeItem, clearCart, loadingIds, fetchCartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
