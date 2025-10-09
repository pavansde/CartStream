// // ProductDetail.jsx
// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { getItemById } from "../api/items";

// function ProductDetail() {
//   const { id } = useParams();
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     getItemById(id)
//       .then((res) => {
//         setItem(res.data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err?.response?.data?.detail || "Failed to fetch product details");
//         setLoading(false);
//       });
//   }, [id]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <div className="text-gray-600 text-xl animate-pulse">Loading product details...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center text-red-600 py-12">
//         <p className="text-lg font-semibold mb-2">Error loading product</p>
//         <p>{error}</p>
//       </div>
//     );
//   }

//   if (!item) {
//     return (
//       <div className="text-center py-12 text-gray-500 text-lg">
//         Product not found.
//       </div>
//     );
//   }
//  const imageUrl = `http://10.10.10.77:8000${item.image_url}`;
//   return (
//     <div className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-8">
//       <div className="flex-shrink-0 w-full md:w-1/2">
//         {item.image_url ? (
//           <img
//             src={imageUrl}
//             alt={item.title}
//             className="w-full h-auto object-contain rounded-md border border-gray-200 shadow-sm"
//           />
//         ) : (
//           <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-md border border-gray-300 text-gray-400">
//             No Image Available
//           </div>
//         )}
//       </div>

//       <div className="flex flex-col flex-grow">
//         <h1 className="text-3xl font-bold mb-4 text-gray-900">{item.title}</h1>

//         <p className="text-gray-700 mb-6 whitespace-pre-wrap">{item.description || "No description available."}</p>

//         <div className="mb-6">
//           <span className="text-2xl font-extrabold text-green-700">₹{item.price.toFixed(2)}</span>
//         </div>

//         <div className="mb-6">
//           <span
//             className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
//               item.stock === 0
//                 ? "bg-red-100 text-red-800 border border-red-300"
//                 : item.low_stock_alert
//                 ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
//                 : "bg-green-100 text-green-800 border border-green-300"
//             }`}
//           >
//             {item.stock === 0
//               ? "Out of Stock"
//               : item.low_stock_alert
//               ? `Low Stock: Only ${item.stock} left!`
//               : `In Stock: ${item.stock}`}
//           </span>
//         </div>

//         {/* Example placeholders for additional details like size/color can go here */}
//         {/* <SizeSelector sizes={item.sizes} />
//             <ColorSelector colors={item.colors} /> */}

//         <button
//           disabled={item.stock === 0}
//           className={`mt-auto w-full md:w-auto px-6 py-3 rounded-md font-semibold text-white shadow-lg transition-colors ${
//             item.stock === 0
//               ? "bg-gray-400 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
//           }`}
//           onClick={() => alert(`Add to cart: ${item.title}`)}
//           aria-disabled={item.stock === 0}
//         >
//           {item.stock === 0 ? "Out of Stock" : "Add to Cart"}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default ProductDetail;


// ProductDetail.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getItemById } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import ErrorState from "../components/ErrorState";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const { user } = useContext(AuthContext);
  const { cart, addItem, loadingIds: cartLoadingIds } = useContext(CartContext);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Enhanced fetch function with better error handling
  const fetchProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getItemById(id);
      setItem(res.data);
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError(
        "Something went wrong on our side. We're working on it and will get back to you soon."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Wishlist handler
  const handleAddToWishlist = async () => {
    if (!user || user.role !== "customer") {
      showToast("Please login as customer to add to wishlist", "error");
      return;
    }

    setWishlistLoading(true);
    try {
      await addToWishlist(item.id);
      showToast(`"${item.title}" added to wishlist!`, "success");
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to add to wishlist";
      showToast(msg, "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  // Cart handler
  // const handleAddToCart = async () => {
  //   setAddingToCart(true);
  //   try {
  //     // Add item multiple times based on quantity
  //     for (let i = 0; i < quantity; i++) {
  //       await addItem(item.id);
  //     }
  //     showToast(`"${item.title}" ${quantity > 1 ? `(${quantity} items) ` : ""}added to cart!`, "success");
  //   } catch (error) {
  //     const msg = error?.response?.data?.detail || error?.message || "Failed to add to cart";
  //     showToast(msg, "error");
  //   } finally {
  //     setAddingToCart(false);
  //   }
  // };

  const handleAddToCart = async () => {
  setAddingToCart(true);
  try {
    // Use the enhanced addItem that accepts quantity
    await addItem(item.id, quantity);
    showToast(`"${item.title}" (${quantity} items) added to cart!`, "success");
  } catch (error) {
    const msg = error?.response?.data?.detail || error?.message || "Failed to add to cart";
    showToast(msg, "error");
  } finally {
    setAddingToCart(false);
  }
};

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= item.stock) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = () => {
    if (!item?.original_price || item.original_price <= item.price) return null;
    return Math.round(((item.original_price - item.price) / item.original_price) * 100);
  };

  // Toast Component
  const Toast = () => {
    if (!toast.show) return null;

    return (
      <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
        <div
          className={`flex items-center p-4 rounded-lg shadow-lg border ${
            toast.type === "success"
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
  const ProductSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-4"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image skeleton */}
          <div className="space-y-4">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 h-20 w-20 rounded"></div>
              ))}
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>

            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>

            <div className="h-10 bg-gray-200 rounded w-32"></div>
            
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <ProductSkeleton />;
  if (error) return <ErrorState onRetry={fetchProduct} message={error} />;
  if (!item) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const discount = calculateDiscount();
  const imageUrl = `http://10.10.10.77:8000${item.image_url}`;
  const images = item.images || [item.image_url];
  const showWishlist = user && user.role === "customer";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notifications */}
        <Toast />

        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-gray-700">Home</Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link to="/items" className="hover:text-gray-700">Products</Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-700 font-medium">{item.title}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={`http://10.10.10.77:8000${images[activeImageIndex]}`}
                  alt={item.title}
                  className="w-full h-96 object-contain"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                  }}
                />
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                        index === activeImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={`http://10.10.10.77:8000${image}`}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (item.rating || 0) ? "text-yellow-400" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({item.review_count || 0} reviews)
                      </span>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
                        item.stock === 0
                          ? "bg-red-100 text-red-800 border-red-300"
                          : item.low_stock_alert
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-green-100 text-green-800 border-green-300"
                      }`}
                    >
                      {item.stock === 0
                        ? "Out of Stock"
                        : item.low_stock_alert
                        ? `Low Stock: Only ${item.stock} left!`
                        : `In Stock: ${item.stock}`}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {showWishlist && (
                    <button
                      onClick={handleAddToWishlist}
                      disabled={wishlistLoading}
                      className={`p-2 rounded-full border transition-colors ${
                        wishlistLoading
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          : "bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500"
                      }`}
                    >
                      {wishlistLoading ? (
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(item.price)}
                  </span>
                  {discount && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(item.original_price)}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {item.tax_info && (
                  <p className="text-sm text-gray-500">+ {item.tax_info}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.description || "No description available."}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= item.stock}
                    className="px-3 py-2 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">Max: {item.stock}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  disabled={item.stock === 0 || addingToCart || cartLoadingIds.has(item.id)}
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors ${
                    item.stock === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  } ${addingToCart || cartLoadingIds.has(item.id) ? "opacity-75 cursor-wait" : ""}`}
                >
                  {addingToCart || cartLoadingIds.has(item.id) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    `Add to Cart${cart[item.id] ? ` (${cart[item.id]} in cart)` : ""}`
                  )}
                </button>

                <button
                  disabled={item.stock === 0 || addingToCart}
                  onClick={handleBuyNow}
                  className={`flex-1 px-8 py-3 border border-transparent text-base font-medium rounded-lg transition-colors ${
                    item.stock === 0
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  } ${addingToCart ? "opacity-75 cursor-wait" : ""}`}
                >
                  Buy Now
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-gray-600">Free shipping</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-gray-600">Secure payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;