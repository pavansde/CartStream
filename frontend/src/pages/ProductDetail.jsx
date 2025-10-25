import { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getItemById } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import ErrorState from "../components/ErrorState";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const apiBaseUrl = process.env.REACT_APP_API_URL;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const { user } = useContext(AuthContext);
  const { cart, addItem, loadingIds } = useContext(CartContext);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const formatAttrLabel = (key) =>
    (key || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formattedAttributes = useMemo(() => {
    const attrs = Array.isArray(item?.attributes) ? item.attributes : [];
    return attrs
      .filter((a) => a?.attribute_key && a?.value !== null && a?.value !== undefined && String(a.value).trim() !== "")
      .map((a) => ({
        key: a.attribute_key,
        label: formatAttrLabel(a.attribute_key),
        value: String(a.value),
      }));
  }, [item]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getItemById(id);
      const itemData = res.data;

      const transformedItem = {
        ...itemData,
        categories: itemData.categories || [],
        attributes: itemData.attributes || [],
        variants: itemData.variants || [],
      };

      setItem(transformedItem);

      if (transformedItem.variants && transformedItem.variants.length > 0) {
        setSelectedVariant(transformedItem.variants[0]);
      } else {
        setSelectedVariant({
          id: null,
          item_id: transformedItem.id,
          size: null,
          color: null,
          price: transformedItem.price || 0,
          stock: transformedItem.stock || 0,
          image_url: transformedItem.image_url,
          images: transformedItem.image_url ? [transformedItem.image_url] : [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Failed to load product details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

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
      const msg = error?.response?.data?.detail || error?.message || "Failed to add to wishlist";
      showToast(msg, "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const variantId = selectedVariant?.id || null;

      const payload = {
        item_id: item.id,
        item_title: item.title,
        variant_id: variantId,
        quantity: quantity,
        variant: selectedVariant,
      };

      await addItem(payload);
      showToast(`"${item.title}" added to cart!`, "success");
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || "Failed to add to cart";
      showToast(msg, "error");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const handleQuantityChange = (newQuantity) => {
    const currentStock = getCurrentStock();
    if (newQuantity >= 1 && newQuantity <= currentStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setActiveImageIndex(0);
    setQuantity(1);
  };

  const getCurrentImages = () => {
    if (!selectedVariant) return [];
    if (selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images.map((img) =>
        img?.startsWith("http") || img?.startsWith("data:") ? img : `${apiBaseUrl}${img}`
      );
    }
    if (selectedVariant.image_url) {
      return [
        selectedVariant.image_url?.startsWith("http") || selectedVariant.image_url?.startsWith("data:")
          ? selectedVariant.image_url
          : `${apiBaseUrl}${selectedVariant.image_url}`,
      ];
    }
    if (item?.image_url) {
      return [item.image_url?.startsWith("http") ? item.image_url : `${apiBaseUrl}${item.image_url}`];
    }
    return [];
  };

  const getCurrentStock = () => {
    if (!selectedVariant) return 0;
    return selectedVariant.stock || 0;
  };

  const getCurrentPrice = () => {
    if (!selectedVariant) return 0;
    return selectedVariant.price || 0;
  };

  const getAvailableColors = () => {
    if (!item?.variants) return [];

    const colors = new Map();
    item.variants.forEach((variant) => {
      if (variant.color && !colors.has(variant.color)) {
        colors.set(variant.color, variant);
      }
    });

    return Array.from(colors.values());
  };

  const getAvailableSizes = () => {
    if (!item?.variants) return [];

    // If the product has a color dimension, filter sizes by selected color
    const hasColorDimension = item.variants.some((v) => v.color);

    if (hasColorDimension) {
      if (!selectedVariant?.color) return [];
      return item.variants.filter(
        (v) => v.color === selectedVariant.color && v.size
      );
    }

    // No color dimension: return unique sizes across all variants
    const bySize = new Map();
    item.variants.forEach((v) => {
      if (v.size && !bySize.has(v.size)) bySize.set(v.size, v);
    });
    return Array.from(bySize.values());
  };

  const getAllVariants = () => {
    if (!item?.variants) return [];
    return item.variants;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCartQuantity = () => {
    const cartItem = Object.values(cart).find(
      (cartItem) =>
        cartItem.item_id === item.id &&
        cartItem.variant_id === (selectedVariant?.id || null)
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const isAddingToCart = () => {
    return Object.keys(loadingIds).some(
      (key) =>
        loadingIds[key] &&
        cart[key]?.item_id === item.id &&
        cart[key]?.variant_id === (selectedVariant?.id || null)
    );
  };

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
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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

  const ProductSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="hidden lg:block lg:col-span-2">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-gray-200 h-[460px] rounded-3xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-12 bg-gray-200 rounded w-2/5" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
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
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const images = getCurrentImages();
  const currentStock = getCurrentStock();
  const currentPrice = getCurrentPrice();
  const availableColors = getAvailableColors();
  const availableSizes = getAvailableSizes();
  const allVariants = getAllVariants();
  const showWishlist = user && user.role === "customer";
  const cartQuantity = getCartQuantity();
  const addingToCart = isAddingToCart();
  const hasMultipleVariants = allVariants.length > 1;

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Toast />

        {/* Breadcrumb light */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-3">
            <li>
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[60vw]">{item.title}</li>
          </ol>
        </nav>

        {/* Main card (reference style: elevated white, rounded) */}
        <div className="relative rounded-[22px] bg-white border border-gray-100 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Vertical thumbnail rail (left) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                {images.length > 0 ? (
                  images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === activeImageIndex ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
                        }`}
                      aria-label={`Show image ${i + 1}`}
                    >
                      <img src={src} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))
                ) : (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full aspect-square rounded-xl bg-gray-100 border border-gray-200" />
                  ))
                )}
              </div>
            </div>

            {/* Main image (center) with soft circular backdrop */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 overflow-hidden h-[460px] flex items-center justify-center">
                <div className="absolute w-[380px] h-[380px] rounded-full bg-white/70 shadow-inner" />
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex]}
                    alt={item.title}
                    className="relative z-10 max-h-[86%] object-contain drop-shadow-md transition-transform duration-300 hover:scale-[1.03]"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                    }}
                  />
                ) : (
                  <div className="relative z-10 text-gray-400">No image</div>
                )}
              </div>

              {/* Small horizontal thumbs on mobile */}
              {images.length > 1 && (
                <div className="mt-3 flex lg:hidden gap-2 overflow-x-auto">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === activeImageIndex ? "border-gray-900" : "border-gray-200"
                        }`}
                    >
                      <img src={src} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel (minimal like reference) */}
            <div className="lg:col-span-5">
              {/* Mini label */}
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                {item.categories?.[0]?.name || "Essentials"}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {item.title}
              </h1>

              {/* Stock */}
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${currentStock === 0
                    ? "bg-red-50 text-red-700 border-red-200"
                    : currentStock <= 5
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-green-50 text-green-700 border-green-200"
                    }`}
                >
                  {currentStock === 0
                    ? "Out of Stock"
                    : currentStock <= 5
                      ? `Only ${currentStock} left!`
                      : "In Stock"}
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 text-4xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </div>

              {/* Colors as small tiles (if present) */}
              {availableColors.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Available Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((v) => {
                      const thumb =
                        v.image_url?.startsWith("http") || v.image_url?.startsWith("data:")
                          ? v.image_url
                          : v.image_url
                            ? `${apiBaseUrl}${v.image_url}`
                            : images[0];
                      const isActive = selectedVariant?.color === v.color;
                      return (
                        <button
                          key={v.color}
                          onClick={() => handleVariantSelect(v)}
                          className={`w-16 h-12 rounded-lg border-2 overflow-hidden flex items-center justify-center transition ${isActive ? "border-gray-900" : "border-gray-200 hover:border-gray-300"
                            }`}
                          title={v.color}
                        >
                          {thumb ? (
                            <img src={thumb} alt={v.color} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant selection (kept as buttons; just styled cleaner) */}
              {hasMultipleVariants && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Variants</h3>
                  <div className="flex flex-wrap gap-2">
                    {allVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        className={`px-3 py-2 rounded-md border text-sm transition ${selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        {[
                          variant.color && `Color: ${variant.color}`,
                          variant.size && `Size: ${variant.size} `,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        • {formatPrice(variant.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes (if available for selected color) */}
              {availableSizes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                    Size
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((variant) => (
                      <button
                        key={variant.size}
                        onClick={() => handleVariantSelect(variant)}
                        className={`px-4 py-2 rounded-md border text-sm transition ${selectedVariant?.size === variant.size
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        {variant.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description (kept) */}
              {item.description && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              )}
              {formattedAttributes.length > 0 && (

                <div className="mt-6"> <details className="rounded-xl border border-gray-200 bg-white"> <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3"> <span className="text-sm font-semibold text-gray-900">Specifications</span> <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /> </svg> </summary> <div className="px-4 pb-4"> <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6"> {formattedAttributes.map((a) => (<div key={`${a.key}-${a.value}`} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100"> <dt className="text-sm text-gray-500">{a.label}</dt> <dd className="text-sm font-medium text-gray-900">{a.value}</dd> </div>))} </dl> </div> </details> </div>)}

              {/* Qty stepper (kept) */}
              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 uppercase">Qty</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="px-5 py-2 text-gray-900 font-medium min-w-[48px] text-center border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {currentStock > 0 && (
                    <span className="text-xs text-gray-500">In stock: {currentStock}</span>
                  )}
                </div>
              </div>

              {/* Actions (Add to Bag black + Wishlist + Buy Now secondary) */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  disabled={currentStock === 0 || addingToCart}
                  onClick={handleAddToCart}
                  className={`col-span-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition ${currentStock === 0 || addingToCart
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900"
                    }`}
                >
                  {addingToCart ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      ADD TO BAG
                      {cartQuantity > 0 ? ` (${cartQuantity})` : ""}
                    </>
                  )}
                </button>

                {showWishlist ? (
                  <button
                    onClick={handleAddToWishlist}
                    disabled={wishlistLoading}
                    className={`inline-flex items-center justify-center px-4 py-3 rounded-md border text-sm font-semibold transition ${wishlistLoading
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    title="Add to Wishlist"
                  >
                    {wishlistLoading ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div className="mt-3">
                <button
                  disabled={currentStock === 0 || addingToCart}
                  onClick={handleBuyNow}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-semibold transition ${currentStock === 0 || addingToCart
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-800 hover:border-gray-400"
                    }`}
                >
                  Buy Now
                </button>
              </div>

              {/* Trust badges (kept) */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-gray-800 font-medium">Free shipping</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-gray-800 font-medium">Secure payment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  <span className="text-gray-800 font-medium">Easy returns</span>
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