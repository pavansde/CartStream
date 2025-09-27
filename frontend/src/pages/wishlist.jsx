import React, { useEffect, useState } from "react";
import { getMyWishlist, removeFromWishlist } from "../api/wishlist";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    try {
      await removeFromWishlist(wishlistEntryId);
      setWishlist((prev) => prev.filter((item) => item.id !== wishlistEntryId));
    } catch (err) {
      setError("Failed to remove item from wishlist.");
      console.error(err);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading your wishlist...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <p className="text-gray-700">You have no items in your wishlist.</p>
      ) : (
        <ul className="space-y-6">
          {wishlist.map((item) => (
            <li
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
            >
              <div className="sm:flex sm:items-center sm:space-x-4 flex-1 mb-4 sm:mb-0">
                <img
                  src={item.item.image_url || "https://via.placeholder.com/100"}
                  alt={item.item.title}
                  className="w-24 h-24 object-cover rounded mr-4"
                />
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">{item.item.title}</h2>
                  <p className="text-gray-600 text-sm mt-1">{item.item.description || "No description"}</p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                <p className="font-semibold text-green-700 text-lg">${item.item.price.toFixed(2)}</p>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="mt-3 sm:mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors duration-200"
                  aria-label={`Remove ${item.item.title} from wishlist`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
