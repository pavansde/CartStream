import React, { useEffect, useState, useContext, useCallback } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const {
    cart, // Direct cart object from context
    updateItemQuantity,
    removeItem,
    clearCart,
    loadingIds,
    fetchCartItems,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Use cart directly from context instead of maintaining separate state
  const cartItems = Object.values(cart);

  // Load cart items from backend via CartContext - ONLY ON MOUNT
  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      if (!mounted) return;

      setLoading(true);
      try {
        console.log("📥 CartPage: Loading cart...");
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

  // Stable wrapper functions with useCallback
  const handleUpdateItemQuantity = useCallback(async (itemId, quantity) => {
    console.log("🔄 handleUpdateItemQuantity:", { itemId, quantity });

    try {
      await updateItemQuantity(itemId, quantity);
      console.log("✅ updateItemQuantity completed");
    } catch (error) {
      console.error("❌ handleUpdateItemQuantity FAILED:", error);
      setError("Failed to update quantity");
    }
  }, [updateItemQuantity]);

  const handleRemoveItem = useCallback(async (itemId) => {
    console.log("🗑️ handleRemoveItem:", itemId);
    await removeItem(itemId);
  }, [removeItem]);

  const handleClearCart = useCallback(async () => {
    try {
      await clearCart();
    } catch (error) {
      console.error("❌ Failed to clear cart:", error);
      setError("Failed to clear cart");
    }
  }, [clearCart]);

  // Calculate totals based on current cart
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const getDisplayPrice = (item) => {
    if (item.variant?.price !== null && item.variant?.price !== undefined) {
      return item.variant.price;
    }
    if (item.item?.price !== null && item.item?.price !== undefined) {
      return item.item.price;
    }
    return 0;
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = getDisplayPrice(item);
    return sum + (price * (item.quantity || 0));
  }, 0);

  const handleCheckoutClick = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout", cartItems } });
    } else {
      navigate("/checkout", { state: { cartItems } });
    }
  };

  // Helper functions
  const getDisplayImage = (item) => {
    if (item.variant?.image_url) {
      return `http://10.10.10.56:8000${item.variant.image_url}`;
    }
    if (item.item?.image_url) {
      return `http://10.10.10.56:8000${item.item.image_url}`;
    }
    return "";
  };

  const getDisplayTitle = (item) => {
    let title = "Unknown Item";

    if (item.item?.title) {
      title = item.item.title;
    }

    if (item.variant) {
      const specs = [];
      if (item.variant.color) specs.push(item.variant.color);
      if (item.variant.size) specs.push(item.variant.size);
      if (specs.length > 0) {
        title += ` (${specs.join(' - ')})`;
      }
    }

    return title;
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

  const isOutOfStock = (item) => {
    return getDisplayStock(item) === 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Your cart is empty
            </h3>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>

            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
            >
              Continue Shopping
            </Link>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Popular categories:</p>
              <div className="flex justify-center space-x-4">
                <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
                  Best Sellers
                </Link>
                <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
                  New Arrivals
                </Link>
                <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
                  Sale Items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={getDisplayImage(item)}
                          alt={getDisplayTitle(item)}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {getDisplayTitle(item)}
                        </h3>

                        {/* Variant Details */}
                        {item.variant && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.variant.color && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Color: {item.variant.color}
                              </span>
                            )}
                            {item.variant.size && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Size: {item.variant.size}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-lg font-semibold text-green-700 mb-2">
                          ₹{getDisplayPrice(item)}
                        </p>

                        <p className={`text-sm ${isOutOfStock(item) ? "text-red-600" : "text-gray-600"}`}>
                          {isOutOfStock(item) ? "Out of stock" : `In stock: ${getDisplayStock(item)} available`}
                        </p>
                      </div>

                      {/* Quantity and Actions */}
                      <div className="flex flex-col sm:items-end gap-3">
                        {/* Quantity Control */}
                        <div className="flex items-center gap-3">
                          <label htmlFor={`qty-${item.id}`} className="text-sm font-medium text-gray-700">
                            Qty:
                          </label>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={loadingIds.has(item.id) || isOutOfStock(item) || item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-gray-900 font-medium min-w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                              disabled={loadingIds.has(item.id) || isOutOfStock(item) || item.quantity >= getDisplayStock(item)}
                              className="px-3 py-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{(getDisplayPrice(item) * item.quantity).toFixed(2)}
                        </p>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={loadingIds.has(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Cart Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Clear entire cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({totalItems})</span>
                  <span className="text-gray-900">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-700">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckoutClick}
                disabled={cartItems.length === 0 || cartItems.some(item => isOutOfStock(item))}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <div className="mt-4 text-center">
                <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}