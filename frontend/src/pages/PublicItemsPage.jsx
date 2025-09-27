import React, { useEffect, useState, useMemo, useContext } from "react";
import { getAllItems } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

export default function PublicItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & sorting state
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const { user } = useContext(AuthContext);
  const { cart, addItem, loadingIds: cartLoadingIds } = useContext(CartContext);
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set());

  useEffect(() => {
    getAllItems()
      .then((res) => {
        setItems(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch items:", err);
        setError("Failed to load products. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let data = [...items];

    if (search.trim()) {
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          (item.description || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (stockFilter === "in") {
      data = data.filter((item) => item.stock > 0 && !item.low_stock_alert);
    } else if (stockFilter === "low") {
      data = data.filter((item) => item.low_stock_alert && item.stock > 0);
    } else if (stockFilter === "out") {
      data = data.filter((item) => item.stock === 0);
    }

    data.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-desc":
          return b.title.localeCompare(a.title);
        case "name-asc":
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return data;
  }, [items, search, stockFilter, sortBy]);

  // Wishlist handler
  const handleAddToWishlist = async (itemId) => {
    setWishlistLoadingIds((prev) => new Set(prev).add(itemId));
    try {
      await addToWishlist(itemId);
      alert("Added to wishlist!");
    } catch (error) {
      // Try to use the response message
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to add to wishlist";
      alert(msg);
    } finally {
      setWishlistLoadingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(itemId);
        return copy;
      });
    }
  };

  // Cart handler
  const handleAddToCart = async (itemId) => {
    await addItem(itemId);
    alert("Added to cart!");
  };

  if (loading) return <p className="p-6 text-gray-500">Loading products...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Available Products</h1>

      {/* Filters & Sorting Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="border p-2 rounded flex-1 min-w-[200px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">All Stock</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="price-asc">Price (Low → High)</option>
          <option value="price-desc">Price (High → Low)</option>
        </select>
      </div>

      {/* Product List */}
      {filteredItems.length === 0 ? (
        <p>No products match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {filteredItems.map((item) => {
            const showWishlist =
              user && (user.role === "customer");
            const showCart = true;

            // Clean backslash if any in URLs
            const cleanUrl = item.image_url?.replace(/\\_/g, "_");

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md flex flex-col justify-between p-5 hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={cleanUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />

                <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
                <p className="text-sm text-gray-600 flex-grow">{item.description}</p>

                <p className="text-green-700 font-bold mt-3">₹{item.price.toFixed(2)}</p>

                <div className="mt-2 flex items-center space-x-2">
                  {item.stock > 0 ? (
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.low_stock_alert
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.low_stock_alert
                        ? `Low Stock (${item.stock})`
                        : `In Stock (${item.stock})`}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-4 flex space-x-3">
                  {showWishlist && (
                    <button
                      onClick={() => handleAddToWishlist(item.id)}
                      disabled={wishlistLoadingIds.has(item.id)}
                      className={`px-3 py-1 rounded ${
                        wishlistLoadingIds.has(item.id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                    >
                      {wishlistLoadingIds.has(item.id) ? "Adding..." : "Add to Wishlist"}
                    </button>
                  )}
                  {showCart && (
                    <button
                      onClick={() => handleAddToCart(item.id)}
                      disabled={cartLoadingIds.has(item.id) || item.stock === 0}
                      className={`px-3 py-1 rounded ${
                        cartLoadingIds.has(item.id) || item.stock === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {cartLoadingIds.has(item.id) ? "Adding..." : "Add to Cart"}
                      {cart[item.id] ? ` (${cart[item.id]})` : ""}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
