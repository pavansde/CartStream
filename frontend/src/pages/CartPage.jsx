import React, { useEffect, useState, useContext, useCallback } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const {
    cart, // from CartContext
    updateItemQuantity,
    removeItem,
    clearCart,
    loadingIds,
    fetchCartItems,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiBaseUrl = process.env.REACT_APP_API_URL;

  // Shipping UI state
  const [shippingMode, setShippingMode] = useState("pickup");
  const SHIPPING_PRICE = 9.9; // adjust as needed
  const shippingCost = shippingMode === "delivery" ? SHIPPING_PRICE : 0;

  // Use cart directly from context
  const cartItems = Object.values(cart);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      if (!mounted) return;

      setLoading(true);
      try {
        // console.log("📥 CartPage: Loading cart...");
        await fetchCartItems();
        setError("");
      } catch (err) {
        if (mounted) {
          setError("Failed to load cart items.");
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Stable handlers
  const handleUpdateItemQuantity = useCallback(
    async (itemId, quantity) => {
      try {
        await updateItemQuantity(itemId, quantity);
      } catch (err) {
        console.error("Failed to update quantity:", err);
        setError("Failed to update quantity");
      }
    },
    [updateItemQuantity]
  );

  const handleRemoveItem = useCallback(
    async (itemId) => {
      await removeItem(itemId);
    },
    [removeItem]
  );

  const handleClearCart = useCallback(
    async () => {
      try {
        await clearCart();
      } catch (err) {
        console.error("Failed to clear cart:", err);
        setError("Failed to clear cart");
      }
    },
    [clearCart]
  );

  // Helpers
  const getDisplayPrice = (item) => {
    if (item.variant?.price !== null && item.variant?.price !== undefined) {
      return item.variant.price;
    }
    if (item.item?.price !== null && item.item?.price !== undefined) {
      return item.item.price;
    }
    return 0;
  };

  const getDisplayImage = (item) => {
    if (item.variant?.image_url) return `${apiBaseUrl}${item.variant.image_url}`;
    if (item.item?.image_url) return `${apiBaseUrl}${item.item.image_url}`;
    return "";
  };

  const getDisplayStock = (item) => {
    if (item.variant?.stock !== null && item.variant?.stock !== undefined) {
      return item.variant.stock;
    }
    if (item.item?.stock !== null && item.item?.stock !== undefined) {
      return item.item.stock;
    }
    return 0;
  };

  const getDisplayTitle = (item) => {
    let title = item.item_title || item.item?.title || "Unknown Item";
    if (item.variant) {
      const specs = [];
      if (item.variant.color) specs.push(item.variant.color);
      if (item.variant.size) specs.push(item.variant.size);
      if (specs.length > 0) title += ` (${specs.join(" - ")})`;
    }
    return title;
  };

  const isOutOfStock = (item) => getDisplayStock(item) === 0;
  const formatCurrency = (n) => `₹${Number(n || 0).toFixed(2)}`;

  // Totals
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + getDisplayPrice(item) * (item.quantity || 0), 0);
  const grandTotal = subtotal + shippingCost;

  const handleCheckoutClick = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout", cartItems } });
    } else {
      navigate("/checkout", { state: { cartItems } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Cart</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6">My Cart</h1>

            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items yet.</p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 14.707a1 1 0 01-1.414 0L7 10.414 3.707 13.707a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 md:px-8 py-6 border-b">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">My Cart</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearCart}
                className="hidden md:inline-flex text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear cart
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 15.293a1 1 0 010 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L10.414 10l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Continue shopping
              </Link>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 md:px-8 py-3 text-[11px] uppercase tracking-wider text-gray-400">
            <div className="col-span-6">Product</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Items */}
          <div className="divide-y">
            {cartItems.map((item) => {
              const price = getDisplayPrice(item);
              const stock = getDisplayStock(item);
              const rowTotal = price * (item.quantity || 0);
              return (
                <div key={item.id} className="px-6 md:px-8 py-6">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Product */}
                    <div className="col-span-12 md:col-span-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={getDisplayImage(item)}
                          alt={getDisplayTitle(item)}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                        <div className="min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                            {getDisplayTitle(item)}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            {item.variant?.color && <span>Color: {item.variant.color}</span>}
                            {item.variant?.color && item.variant?.size && <span> // </span>}
                            {item.variant?.size && <span>Size: {item.variant.size}</span>}
                          </p>
                          <p className={`text-xs mt-1 ${isOutOfStock(item) ? "text-red-600" : "text-gray-500"}`}>
                            {isOutOfStock(item) ? "Out of stock" : `In stock: ${stock} available`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-6 md:col-span-2 md:text-base text-gray-900">
                      <span className="text-sm md:text-base font-medium">{formatCurrency(price)}</span>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 md:col-span-2">
                      <div className="flex items-center gap-3 md:justify-start">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleUpdateItemQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                            disabled={loadingIds.has(item.id) || isOutOfStock(item) || (item.quantity || 1) <= 1}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-gray-900 font-medium min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateItemQuantity(item.id, (item.quantity || 0) + 1)}
                            disabled={loadingIds.has(item.id) || isOutOfStock(item) || (item.quantity || 0) >= stock}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove (mobile) */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={loadingIds.has(item.id)}
                          className="md:hidden text-gray-400 hover:text-red-600"
                          aria-label="Remove item"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Total + Remove */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end">
                      <span className="text-base md:text-right font-semibold text-gray-900">
                        {formatCurrency(rowTotal)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loadingIds.has(item.id)}
                        className="hidden md:inline-flex ml-4 text-gray-400 hover:text-red-600"
                        aria-label="Remove item"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shipping + Summary Card */}
          <div className="px-6 md:px-8 pb-8 pt-4">
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm px-4 py-5 md:px-6 md:py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Shipping options */}
                <div className="md:col-span-2">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
                    Choose shipping mode:
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="shippingMode"
                        value="pickup"
                        checked={shippingMode === "pickup"}
                        onChange={() => setShippingMode("pickup")}
                        className="mt-1 h-4 w-4 text-red-500 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">Store pickup</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-500">in 20 min</span>
                          <span className="ml-2 inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            FREE
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pick up at the store counter
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input
                        type="radio"
                        name="shippingMode"
                        value="delivery"
                        checked={shippingMode === "delivery"}
                        onChange={() => setShippingMode("delivery")}
                        className="mt-1 h-4 w-4 text-red-500 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">Delivery at home</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-500">under 2–4 days</span>
                          <span className="ml-2 inline-block text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                            {formatCurrency(SHIPPING_PRICE)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          At your address (standard delivery)
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          At 45 Gleridge Ave. Brooklyn, NY 11220
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="md:col-span-1">
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? "text-emerald-600" : "text-gray-900"}>
                        {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3">
                      <div className="flex justify-between text-base font-semibold text-gray-900">
                        <span>Total</span>
                        <span className="text-gray-900">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckoutClick}
                      disabled={
                        cartItems.length === 0 ||
                        cartItems.some((item) => isOutOfStock(item))
                      }
                      className="mt-4 w-full inline-flex items-center justify-between gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Checkout</span>
                      <span className="inline-block bg-white/10 px-3 py-1 rounded-md">
                        {formatCurrency(grandTotal)}
                      </span>
                    </button>

                    <div className="text-center mt-3">
                      <Link
                        to="/"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                      >
                        Continue shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Clear Cart */}
            <div className="mt-4 md:hidden text-right">
              <button
                onClick={handleClearCart}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear entire cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}