import React, { createContext, useState, useEffect, useMemo, useCallback, useContext } from "react";
import { AuthContext } from "./AuthContext";
import {
  getCartItems,
  addOrUpdateCartItem,
  removeCartItem,
  clearCart as clearCartAPI,
} from "../api/cart";
import { getAllItems, getItemById } from "../api/items";

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

  // Helper function to get cart key
  const getCartKey = (itemId, variantId) => {
    return variantId ? `${itemId}-${variantId}` : `${itemId}`;
  };

  const addItem = useCallback(async (payload) => {
    const { item_id,item_title, variant_id, quantity = 1 } = payload;

    // console.log("➕ addItem called with:", payload);

    // For guest users: create a temporary ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    // Get variant data if available
    let variantData = null;
    if (payload.variant) {
      variantData = payload.variant;
    }

    // Optimistic update
    const newCartItem = {
      id: tempId,           // temporary ID for guest
      item_id,
      item_title,
      variant_id,
      quantity,
      variant: variantData, // preserve variant data
      isTemp: true          // mark as temporary
    };

    setCart(prev => ({
      ...prev,
      [tempId]: newCartItem
    }));

    // For logged-in users: make API call
    if (user && authToken) {
      try {
        const response = await addOrUpdateCartItem({
          item_id,
          variant_id,
          quantity
        }, authToken);

        const backendItem = response.data;

        // Replace temporary item with backend item
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[tempId]; // remove temp
          newCart[backendItem.id] = { // use backend ID
            id: backendItem.id,
            item_id: backendItem.item_id || item_id,
            variant_id: backendItem.variant_id || variant_id,
            quantity: backendItem.quantity || quantity,
            variant: variantData // preserve variant data
          };
          return newCart;
        });
      } catch (error) {
        // Revert on error
        setCart(prev => {
          const newCart = { ...prev };
          delete newCart[tempId];
          return newCart;
        });
        throw error;
      }
    }
  }, [user, authToken]);

  // Enhanced fetchCartItems to include variant data
  const fetchCartItems = useCallback(async () => {
    if (!user || !authToken) {
      // For guest users: return items from local storage
      return Object.values(cart).filter(item => item.isTemp);
    }

    // For logged-in users: fetch from backend
    try {
      const response = await getCartItems(authToken);
      const backendItems = response.data;

      // console.log("🛒 Backend cart items:", backendItems);

      // Enhanced: Fetch variant data for each item
      const enhancedCart = {};

      for (const item of backendItems) {
        try {
          // Get item ID from either item_id or nested item object
          const itemId = item.item_id || (item.item && item.item.id);

          if (!itemId) {
            console.error('❌ Cart item missing item ID:', item);
            continue;
          }

          // Use existing item data if available, otherwise fetch it
          let fullItem = item.item;
          let selectedVariant = null;

          if (!fullItem || !fullItem.id) {
            const itemResponse = await getItemById(itemId);
            fullItem = itemResponse.data;
          }

          // Find the specific variant that's in the cart
          if (item.variant_id && fullItem.variants) {
            selectedVariant = fullItem.variants.find(v => v.id === item.variant_id);
          }

          enhancedCart[item.id] = {
            id: item.id,
            item_id: itemId,
            variant_id: item.variant_id,
            quantity: item.quantity,
            variant: selectedVariant,
            item: fullItem // include full item data for display
          };
        } catch (error) {
          console.error(`❌ Failed to process cart item ${item.id}:`, error);
          // Still add the item without enhanced data
          enhancedCart[item.id] = {
            id: item.id,
            item_id: item.item_id,
            variant_id: item.variant_id,
            quantity: item.quantity
          };
        }
      }

      // Update local state
      setCart(enhancedCart);

      return Object.values(enhancedCart);
    } catch (error) {
      console.error("❌ Failed to fetch cart items", error);
      return [];
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
  const mergeGuestCart = useCallback(async (token) => {
    const guestCart = JSON.parse(localStorage.getItem("cart") || "{}");

    // Only merge temporary (guest) items
    const tempItems = Object.values(guestCart).filter(item => item.isTemp);

    for (const item of tempItems) {
      try {
        await addOrUpdateCartItem({
          item_id: item.item_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        }, token);
      } catch (error) {
        console.error("Failed to merge item:", error);
      }
    }

    // Clear guest cart after merge
    localStorage.setItem("cart", JSON.stringify({}));
  }, []);
  const removeItem = useCallback(async (cartItemId) => {
    // console.log("🗑️ removeItem called with:", cartItemId);

    const itemToRemove = cart[cartItemId];
    if (!itemToRemove) return;

    // Optimistic removal
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[cartItemId];
      return newCart;
    });

    // For logged-in users: remove from backend (only if it's a real backend ID, not temp)
    if (user && authToken && !itemToRemove.isTemp) {
      try {
        await removeCartItem(cartItemId, authToken);
      } catch (error) {
        // Revert on error
        setCart(prev => ({
          ...prev,
          [cartItemId]: itemToRemove
        }));
        throw error;
      }
    }
  }, [user, authToken, cart]);

  const updateItemQuantity = useCallback(
    async (cartItemId, quantity) => {
      // console.log("🎯 updateItemQuantity called:", { cartItemId, quantity });

      if (quantity <= 0) {
        // console.log("🎯 Quantity <= 0, calling removeItem");
        removeItem(cartItemId);
        return;
      }

      const itemToUpdate = cart[cartItemId];
      if (!itemToUpdate) return;

      setLoadingIds((prev) => new Set(prev).add(cartItemId));

      // Optimistic update
      setCart((prev) => ({
        ...prev,
        [cartItemId]: {
          ...prev[cartItemId],
          quantity: quantity
        }
      }));

      if (user && authToken && !itemToUpdate.isTemp) {
        try {
          // console.log("🎯 Updating backend cart");
          await addOrUpdateCartItem({
            item_id: itemToUpdate.item_id,
            variant_id: itemToUpdate.variant_id,
            quantity: quantity
          }, authToken);
        } catch (error) {
          console.error("❌ Failed to update backend cart", error);
          // Revert on error
          setCart((prev) => ({
            ...prev,
            [cartItemId]: itemToUpdate
          }));
          throw error;
        }
      }

      setLoadingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(cartItemId);
        return copy;
      });
    },
    [user, authToken, cart, removeItem]
  );
  const value = useMemo(
    () => ({
      cart,
      addItem,
      mergeGuestCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      loadingIds,
      fetchCartItems,
    }),
    [cart, addItem, updateItemQuantity, removeItem, clearCart, loadingIds, fetchCartItems, mergeGuestCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};