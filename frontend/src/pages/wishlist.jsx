import React, { useEffect, useState } from "react";
import { getMyWishlist, removeFromWishlist } from "../api/wishlist";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const res = await getMyWishlist();
        setWishlist(res.data);
        setError("");
      } catch (err) {
        setError("Failed to load wishlist.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemove = async (wishlistEntryId) => {
    setRemovingId(wishlistEntryId);
    try {
      await removeFromWishlist(wishlistEntryId);
      setWishlist((prev) => prev.filter((item) => item.id !== wishlistEntryId));
      setError("");
    } catch (err) {
      setError("Failed to remove item from wishlist.");
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
    }

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // For static files, point to the backend server
    const backendBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    return `${backendBaseUrl}/${cleanPath}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Price not available";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg bg-white">
                <div className="w-24 h-24 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">Your saved items</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl text-gray-400">❤️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Start adding items you love to your wishlist. They'll appear here for easy access later.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={getImageUrl(item.item.image_url)}
                      alt={item.item.title}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 text-lg mb-1">
                        {item.item.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {item.item.description || "No description available"}
                      </p>
                      {item.item.variant_color || item.item.variant_size ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.item.variant_color && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Color: {item.item.variant_color}
                            </span>
                          )}
                          {item.item.variant_size && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Size: {item.item.variant_size}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <p className="font-bold text-green-700 text-xl">
                        {formatCurrency(item.item.price)}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // Add to cart functionality can go here
                          console.log('Add to cart:', item.item.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        aria-label={`Remove ${item.item.title} from wishlist`}
                      >
                        {removingId === item.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Removing...
                          </>
                        ) : (
                          'Remove'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wishlist Stats */}
        {wishlist.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in wishlist
              </span>
              <button
                onClick={() => {
                  // Clear all functionality can go here
                  console.log('Clear all wishlist items');
                }}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}