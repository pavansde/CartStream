import React, { useEffect, useState, useMemo, useContext } from "react";
import { getAllItems } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import ErrorState from "../components/ErrorState";

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

  // Enhanced fetch function with better error handling
  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getAllItems();
      setItems(res.data);
    } catch (err) {
      // Log the detailed error for devs / monitoring (not shown to users)
      console.error("Failed to fetch items:", err);

      // Always show one friendly fallback message to users
      setError(
        "Something went wrong on our side. We're working on it and will get back to you soon."
      );

      // Optional: send to monitoring service here (Sentry, LogRocket, etc.)
      // captureError(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchItems();
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

  if (error) return <ErrorState onRetry={fetchItems} message={error} />;

  // Wishlist handler
  const handleAddToWishlist = async (itemId) => {
    setWishlistLoadingIds((prev) => new Set(prev).add(itemId));
    try {
      await addToWishlist(itemId);
      alert("Added to wishlist!");
    } catch (error) {
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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>

        {/* Filter skeleton */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded flex-1 min-w-[200px]"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-5">
              <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
      <p className="text-gray-600 mb-4">
        {search || stockFilter !== "all"
          ? "No products match your current filters. Try adjusting your search or filters."
          : "There are currently no products available. Please check back later."
        }
      </p>
      {(search || stockFilter !== "all") && (
        <button
          onClick={() => {
            setSearch("");
            setStockFilter("all");
          }}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Available Products</h1>

      {/* Filters & Sorting Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="border border-gray-300 p-3 rounded-lg flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Stock</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="price-asc">Price (Low → High)</option>
          <option value="price-desc">Price (High → Low)</option>
        </select>
      </div>

      {/* Product List */}
      {filteredItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {filteredItems.map((item) => {
            const showWishlist = user && user.role === "customer";
            const showCart = true;

            // Clean backslash if any in URLs
            const cleanUrl = item.image_url?.replace(/\\_/g, "_");

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md flex flex-col justify-between p-5 hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="flex-1">
                  <img
                    src={cleanUrl || "/api/placeholder/200/200"}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded mb-4 bg-gray-100"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                    }}
                  />

                  <h2 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-600 flex-grow line-clamp-3 mb-3">
                    {item.description || "No description available"}
                  </p>

                  <p className="text-green-700 font-bold text-lg mb-3">
                    ₹{item.price.toFixed(2)}
                  </p>

                  <div className="mb-4">
                    {item.stock === 0 ? (
                      <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium border border-red-200">
                        Out of Stock
                      </span>
                    ) : item.stock <= 5 ? (
                      <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium border border-yellow-200">
                        {item.stock === 1 ? "Only 1 left!" : `Only ${item.stock} left!`}
                      </span>
                    ) : null}
                  </div>

                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {showWishlist && (
                    <button
                      onClick={() => handleAddToWishlist(item.id)}
                      disabled={wishlistLoadingIds.has(item.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${wishlistLoadingIds.has(item.id)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${cartLoadingIds.has(item.id) || item.stock === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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