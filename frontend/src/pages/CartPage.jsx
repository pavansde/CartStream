import React, { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const {
    updateItemQuantity,
    removeItem,
    clearCart,
    loadingIds,
    fetchCartItems,
  } = useContext(CartContext);
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load cart items from backend via CartContext
  useEffect(() => {
    async function loadCart() {
      setLoading(true);
      try {
        const items = await fetchCartItems();
        setCartItems(items);
        setError("");
      } catch (err) {
        setError("Failed to load cart items.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [fetchCartItems]);

  // Trigger cart reload after quantity update or remove
  // Using a refresh flag to re-fetch cartItems after changes
  const [refreshFlag, setRefreshFlag] = useState(false);

  useEffect(() => {
    if (!loading) {
      async function reloadCart() {
        try {
          const items = await fetchCartItems();
          setCartItems(items);
          setError("");
        } catch (err) {
          setError("Failed to load cart items.");
          console.error(err);
        }
      }
      reloadCart();
    }
  }, [refreshFlag, fetchCartItems, loading]);

  // Wrapper for update quantity to refresh after update completes
  async function handleUpdateItemQuantity(itemId, quantity) {
    await updateItemQuantity(itemId, quantity);
    setRefreshFlag((v) => !v);
  }

  // Wrapper for remove item to refresh after removal completes
  async function handleRemoveItem(itemId) {
    await removeItem(itemId);
    setRefreshFlag((v) => !v);
  }

  // Calculate total price over all items
  const totalPrice = cartItems.reduce((sum, { item, quantity }) => {
  if (!item || typeof item.price !== "number") return sum;
  return sum + item.price * quantity;
}, 0);


  const handleCheckoutClick = () => {
  if (!user) {
    navigate("/login", { state: {from: "/checkout", cartItems } });
  } else {
    navigate("/checkout", { state: { cartItems } }); // pass current cart items
  }
};


  if (loading) {
    return (
      <p className="p-6 text-center text-gray-600" aria-live="polite" role="status">
        Loading cart...
      </p>
    );
  }

  if (error) {
    return (
      <p className="p-6 text-center text-red-600" role="alert">
        {error}
      </p>
    );
  }

  // if (cartItems.length === 0) {
  //   return (
  //     <div className="p-6 text-gray-600 font-semibold text-center">
  //       Your cart is empty.
  //     </div>
  //   );
  // }

  if (cartItems.length === 0) {
  return (
    <div className="max-w-md mx-auto p-8 text-center">
      {/* Icon */}
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

      {/* Message */}
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        Your cart is empty
      </h3>
      <p className="text-gray-600 mb-8">
        Looks like you haven't added any items to your cart yet.
      </p>

      {/* Action Button */}
      <button
        onClick={() => window.location.href = '/'} // or your navigation logic
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 transform hover:scale-105"
      >
        Continue Shopping
      </button>

      {/* Additional Suggestions */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Popular categories:</p>
        <div className="flex justify-center space-x-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
            Best Sellers
          </button>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
            New Arrivals
          </button>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition">
            Sale Items
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <main className="p-6 max-w-4xl mx-auto" aria-label="Shopping Cart">
      <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>

      <ul className="space-y-6 mb-6">
        {cartItems.map(({ id, item, quantity }) =>
          item ? (
            <li
              key={id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition"
            >
              <div className="sm:flex sm:items-center sm:space-x-4 flex-1 mb-4 sm:mb-0">
                <img
                  src={item.image_url || "/images/placeholder.jpg"}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded mr-4"
                  onError={(e) => (e.currentTarget.src = "")}
                />
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">{item.title}</h2>
                  <p className={`mt-1 ${item.stock === 0 ? "text-red-600" : "text-gray-600"}`}>
                    {item.stock === 0 ? "Out of stock" : `Stock: ${item.stock}`}
                  </p>
                  <p className="mt-1 font-semibold text-green-700">₹{item.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <label htmlFor={`qty-${id}`} className="text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  id={`qty-${id}`}
                  type="number"
                  min={1}
                  max={item.stock}
                  value={quantity}
                  disabled={loadingIds.has(id) || item.stock === 0}
                  onChange={(e) =>
                    handleUpdateItemQuantity(item.id, Math.min(item.stock, Number(e.target.value)))
                  }
                  className="border rounded py-2 px-3 text-center w-20"
                  aria-label={`Quantity for ${item.title}`}
                />

                <p className="mt-2 font-semibold text-right">
                  Subtotal: ₹{(item.price * quantity).toLocaleString()}
                </p>

                <button
                  onClick={() => handleRemoveItem(id)}
                  disabled={loadingIds.has(id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition disabled:opacity-50"
                  aria-label={`Remove ${item.title} from cart`}
                >
                  Remove
                </button>
              </div>
            </li>
          ) : null
        )}
      </ul>

      <div className="flex justify-between items-center border-t pt-6 mt-6">
        <p className="text-xl font-bold text-gray-900">
          Total: <span className="text-blue-700">₹{totalPrice.toLocaleString()}</span>
        </p>

        <div className="flex gap-4">
          <button
            onClick={clearCart}
            disabled={cartItems.length === 0}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 transition"
            aria-label="Clear Cart"
          >
            Clear Cart
          </button>

          <button
            onClick={handleCheckoutClick}
            disabled={cartItems.length === 0}
            className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50 shadow transition"
            aria-label="Proceed to Checkout"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
