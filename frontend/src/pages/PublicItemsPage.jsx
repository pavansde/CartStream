import React, { useEffect, useState, useMemo, useContext } from "react";
import { getAllItems } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import ErrorState from "../components/ErrorState";
import { Link } from "react-router-dom";


export default function PublicItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & sorting state
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
      console.error("Failed to fetch items:", err);
      setError(
        "Something went wrong on our side. We're working on it and will get back to you soon."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

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

    data = data.filter((item) => {
      const totalStock = item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      switch (stockFilter) {
        case "in":
          return totalStock > 0;
        case "low":
          return totalStock > 0 && totalStock <= 5;
        case "out":
          return totalStock === 0;
        default:
          return true;
      }
    });

    data.sort((a, b) => {
      const aPrice =
        a.variants && a.variants.length > 0
          ? Math.min(...a.variants.map((v) => v.price ?? Infinity))
          : Infinity;
      const bPrice =
        b.variants && b.variants.length > 0
          ? Math.min(...b.variants.map((v) => v.price ?? Infinity))
          : Infinity;

      switch (sortBy) {
        case "price-asc":
          return aPrice - bPrice;
        case "price-desc":
          return bPrice - aPrice;
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
  const handleAddToWishlist = async (itemId, itemTitle) => {
    setWishlistLoadingIds((prev) => new Set(prev).add(itemId));
    try {
      await addToWishlist(itemId);
      showToast(`"${itemTitle}" added to wishlist!`, "success");
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to add to wishlist";
      showToast(msg, "error");
    } finally {
      setWishlistLoadingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(itemId);
        return copy;
      });
    }
  };

  // Cart handler - FIXED VERSION
  const handleAddToCart = async (itemId, itemTitle, itemVariants) => {
    try {
      const variantId = itemVariants && itemVariants.length > 0
        ? itemVariants[0].id
        : null;

      const selectedVariant = itemVariants && itemVariants.length > 0
        ? itemVariants[0]
        : null;

      const payload = {
        item_id: itemId,
        variant_id: variantId,
        quantity: 1,
        variant: selectedVariant // Include variant data
      };

      console.log("🛒 Add to Cart Payload:", payload);

      await addItem(payload);
      showToast(`"${itemTitle}" added to cart!`, "success");
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || "Failed to add to cart";
      showToast(msg, "error");
    }
  };

  // Toast Component
  const Toast = () => {
    if (!toast.show) return null;

    return (
      <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
        <div
          className={`flex items-center p-4 rounded-lg shadow-lg border ${toast.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
            }`}
        >
          <div className="flex items-center">
            {toast.type === "success" ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
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
      {/* Toast Notifications */}
      <Toast />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => {
            const totalStock = item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
            const itemPrice =
              item.variants && item.variants.length > 0
                ? Math.min(...item.variants.map((v) => v.price ?? Infinity))
                : null;

            // Image fallback from first variant's first image or placeholder
            const imageUrl = item.image_url
              ? `http://10.10.10.56:8000${item.image_url}`
              : item.variants && item.variants.length > 0 && item.variants[0].images.length > 0
                ? `http://10.10.10.56:8000${item.variants[0].images[0]}`
                : "placeholder-image-url"; // replace with your placeholder if needed

            const showWishlist = user && user.role === "customer";
            const showCart = true;

            return (
              <Link
                to={`/items/${item.id}`}
                key={item.id}
                className="bg-white rounded-lg shadow-md flex flex-col justify-between p-5 hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="flex-1">
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded mb-4 bg-gray-100"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                    }}
                  />
                  <h2 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-2">{item.title}</h2>
                  <p className="text-sm text-gray-600 flex-grow line-clamp-3 mb-3">{item.description || "No description available"}</p>
                  <p className="text-green-700 font-bold text-lg mb-3">
                    {itemPrice !== null ? `₹${itemPrice}` : "Price not available"}
                  </p>
                  <div className="mb-4">
                    {totalStock === 0 ? (
                      <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium border border-red-200">Out of Stock</span>
                    ) : totalStock <= 5 ? (
                      <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium border border-yellow-200">
                        {totalStock === 1 ? "Only 1 left!" : `Only ${totalStock} left!`}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {showWishlist && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToWishlist(item.id, item.title);
                      }}
                      disabled={wishlistLoadingIds.has(item.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${wishlistLoadingIds.has(item.id)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                        }`}
                    >
                      {wishlistLoadingIds.has(item.id) ? "Adding..." : "Add to Wishlist"}
                    </button>
                  )}

                  {showCart && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Pass item variants to the function
                        handleAddToCart(item.id, item.title, item.variants);
                      }}
                      disabled={cartLoadingIds.has(item.id) || totalStock === 0}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${cartLoadingIds.has(item.id) || totalStock === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                      {cartLoadingIds.has(item.id) ? "Adding..." : `Add to Cart${cart[item.id] ? ` (${cart[item.id]})` : ""}`}
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} a