import { useEffect, useState, useMemo, useContext } from "react";
import { getAllItems } from "../api/items";
import { addToWishlist } from "../api/wishlist";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import ErrorState from "../components/ErrorState";
import { Link } from "react-router-dom";

export default function PublicItemsPage() {
  const apiBaseUrl = process.env.REACT_APP_API_URL;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & sorting state (unchanged behavior)
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Hero slides (replace images/titles as you like)
  const heroSlides = useMemo(
    () => [
      {
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1920&auto=format&fit=crop",
        tag: "Fresh Arrivals",
        title: "Sneakers for City Living",
      },
      {
        image:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1920&auto=format&fit=crop",
        tag: "Daily Essentials",
        title: "Minimal Styles You’ll Love",
      },
    ],
    []
  );

  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const prevHero = () =>
    setHeroIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  const nextHero = () => setHeroIndex((i) => (i + 1) % heroSlides.length);

  // Autoplay with pause on hover/focus
  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isHeroPaused, heroSlides.length]);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Contexts (unchanged)
  const { user } = useContext(AuthContext);
  const { cart, addItem, loadingIds: cartLoadingIds } = useContext(CartContext);
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set());

  // Fetch items (unchanged)
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllItems();
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Something went wrong on our side. We're working on it and will get back to you soon.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Toast helper (unchanged)
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Format INR (unchanged)
  const formatINR = (val) => {
    const num = typeof val === "number" ? val : parseFloat(val || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
  };

  // Derive all categories (unchanged)
  const allCategories = useMemo(() => {
    const categoriesSet = new Set();
    items.forEach((item) => {
      item.categories?.forEach((cat) => {
        categoriesSet.add(JSON.stringify(cat));
      });
    });
    return Array.from(categoriesSet).map((s) => JSON.parse(s));
  }, [items]);

  // Derive all brands (unchanged)
  const allBrands = useMemo(() => {
    const brandsSet = new Set();
    items.forEach((item) => {
      if (item.brand) brandsSet.add(item.brand);
    });
    return Array.from(brandsSet);
  }, [items]);

  // Toggles (unchanged)
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };
  const toggleBrand = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((n) => n !== brandName) : [...prev, brandName]
    );
  };

  // Clear filters (unchanged)
  const clearCategories = () => setSelectedCategories([]);
  const clearBrands = () => setSelectedBrands([]);
  const clearAllFilters = () => {
    setSearch("");
    setStockFilter("all");
    setSortBy("name-asc");
    setSelectedCategories([]);
    setSelectedBrands([]);
  };

  // Filter & sort (unchanged behavior)
  const filteredItems = useMemo(() => {
    let data = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      data = data.filter(
        (item) => item.categories && item.categories.some((cat) => selectedCategories.includes(cat.id))
      );
    }

    if (selectedBrands.length > 0) {
      data = data.filter((item) => item.brand && selectedBrands.includes(item.brand));
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
      const minPrice = (it) =>
        it.variants?.length ? Math.min(...it.variants.map((v) => v.price ?? Infinity)) : Infinity;
      const aPrice = minPrice(a);
      const bPrice = minPrice(b);
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
  }, [items, search, stockFilter, sortBy, selectedCategories, selectedBrands]);

  if (error) return <ErrorState onRetry={fetchItems} message={error} />;

  // Wishlist handler (unchanged)
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

  // Cart handler (unchanged)
  const handleAddToCart = async (itemId, itemTitle, itemVariants) => {
    try {
      const variantId = itemVariants?.length ? itemVariants[0].id : null;
      const selectedVariant = itemVariants?.length ? itemVariants[0] : null;

      const payload = {
        item_id: itemId,
        item_title: itemTitle,
        variant_id: variantId,
        quantity: 1,
        variant: selectedVariant,
      };

      await addItem(payload, itemTitle);
      showToast(`"${itemTitle}" added to cart!`, "success");
    } catch (error) {
      const msg =
        error?.response?.data?.detail || error?.message || "Failed to add to cart";
      showToast(msg, "error");
    }
  };

  // Toast
  const Toast = () => {
    if (!toast.show) return null;
    return (
      <div className="fixed top-6 right-6 z-[60]" aria-live="polite" role="status">
        <div
          className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border transition-all duration-200 ${toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
            }`}
        >
          <div className="font-medium">{toast.message}</div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-[320px] rounded-3xl bg-gray-200 mb-8" />
          <div className="grid grid-cols-12 gap-6">
            <div className="hidden lg:block col-span-3">
              <div className="h-72 bg-white border border-gray-200 rounded-2xl" />
            </div>
            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="h-44 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-9 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
      <p className="text-gray-600 mb-6 max-w-xl mx-auto">
        {search || stockFilter !== "all" || selectedCategories.length > 0 || selectedBrands.length > 0
          ? "No products match your current filters. Try adjusting your search or filters."
          : "There are currently no products available. Please check back later."}
      </p>
      {(search || stockFilter !== "all" || selectedCategories.length > 0 || selectedBrands.length > 0) && (
        <button
          onClick={clearAllFilters}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toast />

      {/* HERO (Mixtas-inspired) */}
      <section className="relative" aria-label="Hero carousel">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gray-100"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onFocus={() => setIsHeroPaused(true)}
            onBlur={() => setIsHeroPaused(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") prevHero();
              if (e.key === "ArrowRight") nextHero();
            }}
            tabIndex={0} // keyboard focusable
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured banners"
            aria-live="polite"
          >
            {/* Slide track */}
            <div
              className="flex w-full h-[300px] md:h-[420px] transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${heroIndex * 100}%)` }}
            >
              {heroSlides.map((s, idx) => (
                <div
                  key={idx}
                  className="relative min-w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${s.image}')` }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${heroSlides.length}`}
                />
              ))}
            </div>

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

            {/* Overlay content bound to current slide */}
            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center">
              {!!heroSlides.length && (
                <>
                  {heroSlides[heroIndex].tag && (
                    <span className="text-white/70 text-xs tracking-widest uppercase mb-2">
                      {heroSlides[heroIndex].tag}
                    </span>
                  )}
                  {heroSlides[heroIndex].title && (
                    <h1 className="text-white text-4xl md:text-5xl font-extrabold max-w-xl leading-[1.1]">
                      {heroSlides[heroIndex].title}
                    </h1>
                  )}
                </>
              )}

              {/* In-hero search (your existing state) */}
              <div className="mt-6 max-w-xl">
                <div className="bg-white/95 backdrop-blur rounded-full shadow-lg border border-gray-200 flex items-center px-4 py-2.5">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search on our store"
                    className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search products"
                  />
                  <button
                    type="button"
                    className="ml-2 px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-black transition"
                    onClick={() => { }}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Prev/Next controls */}
            <button
              onClick={prevHero}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextHero}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white border border-gray-200 shadow flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full border border-white/70 transition ${i === heroIndex ? "bg-white" : "bg-white/50 hover:bg-white"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Section header row */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">New Arrivals</h2>

            {/* Quick filters for mobile (unchanged) */}
            <div className="flex items-center gap-3 sm:hidden">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mt-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-12 gap-6">
          {/* Sticky left sidebar */}
          <aside className="hidden lg:block col-span-3">
            <div className="sticky top-6 space-y-6">
              {/* Category */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Category</h3>
                  <button onClick={clearCategories} className="text-sm text-blue-600 hover:text-blue-800">
                    Clear
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allCategories.length > 0 ? (
                    allCategories.map((category) => (
                      <label key={category.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span>{category.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No categories available</p>
                  )}
                </div>
              </div>

              {/* Brand */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Brand</h3>
                  <button onClick={clearBrands} className="text-sm text-blue-600 hover:text-blue-800">
                    Clear
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {allBrands.length > 0 ? (
                    allBrands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span>{brand}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No brands available</p>
                  )}
                </div>
              </div>

              {/* Stock pills */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Stock</h3>
                <div className="inline-flex bg-gray-100 rounded-full p-1">
                  {[
                    { key: "all", label: "All" },
                    { key: "in", label: "In" },
                    { key: "low", label: "Low" },
                    { key: "out", label: "Out" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setStockFilter(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${stockFilter === opt.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-800"
                        }`}
                      aria-pressed={stockFilter === opt.key}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Sort by</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="name-desc">Name (Z–A)</option>
                  <option value="price-asc">Price (Low → High)</option>
                  <option value="price-desc">Price (High → Low)</option>
                </select>

                {(selectedCategories.length > 0 ||
                  selectedBrands.length > 0 ||
                  stockFilter !== "all" ||
                  search) && (
                    <button
                      onClick={clearAllFilters}
                      className="w-full mt-3 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                    >
                      Clear All
                    </button>
                  )}
              </div>
            </div>
          </aside>

          {/* Main grid */}
          <main className="col-span-12 lg:col-span-9">
            {/* Active filter pills */}
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || search || stockFilter !== "all") && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map((categoryId) => {
                  const category = allCategories.find((c) => c.id === categoryId);
                  return (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {category?.name}
                      <button
                        onClick={() => toggleCategory(categoryId)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        aria-label={`Remove category ${category?.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
                {selectedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    {brand}
                    <button
                      onClick={() => toggleBrand(brand)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                      aria-label={`Remove brand ${brand}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    Search: {search}
                    <button
                      onClick={() => setSearch("")}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {stockFilter !== "all" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Stock: {stockFilter === "in" ? "In Stock" : stockFilter === "low" ? "Low Stock" : "Out of Stock"}
                    <button
                      onClick={() => setStockFilter("all")}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                      aria-label="Clear stock filter"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Product grid */}
            {filteredItems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const totalStock =
                    item.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  const itemPrice =
                    item.variants && item.variants.length > 0
                      ? Math.min(...item.variants.map((v) => v.price ?? Infinity))
                      : null;

                  const imageUrl = item.image_url
                    ? `${apiBaseUrl}${item.image_url}`
                    : item.variants && item.variants.length > 0
                      ? item.variants[0].image_url
                        ? `${apiBaseUrl}${item.variants[0].image_url}`
                        : item.variants[0].variant_images?.[0]?.image_url
                          ? `${apiBaseUrl}${item.variants[0].variant_images[0].image_url}`
                          : "placeholder-image-url"
                      : "placeholder-image-url";

                  const firstCategory = item.categories?.[0]?.name;

                  return (
                    <Link
                      to={`/items/${item.id}`}
                      key={item.id}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {/* Image */}
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNiMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                          }}
                        />
                        {item.brand && (
                          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur rounded-md border border-gray-200 text-gray-800 shadow-sm">
                            {item.brand}
                          </span>
                        )}
                        {firstCategory && (
                          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-gray-900/90 text-white rounded-full shadow-sm">
                            {firstCategory}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 mt-4">
                        <h3 className="font-semibold text-gray-900 text-base line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {item.description || "No description available"}
                        </p>

                        {/* Extra category chips */}
                        {item.categories && item.categories.length > 1 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.categories.slice(1, 3).map((category) => (
                              <span key={category.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {category.name}
                              </span>
                            ))}
                            {item.categories.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                +{item.categories.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price + Stock */}
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">
                            {itemPrice !== null ? formatINR(itemPrice) : "Price not available"}
                          </p>
                          <div>
                            {totalStock === 0 ? (
                              <span className="px-2.5 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium border border-red-200">
                                Out of Stock
                              </span>
                            ) : totalStock <= 5 ? (
                              <span className="px-2.5 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium border border-yellow-200">
                                {totalStock === 1 ? "Only 1 left!" : `Only ${totalStock} left!`}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {user && user.role === "customer" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToWishlist(item.id, item.title);
                            }}
                            disabled={wishlistLoadingIds.has(item.id)}
                            className={`px-4 py-2.5 rounded-full font-medium transition-all border ${wishlistLoadingIds.has(item.id)
                                ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                                : "bg-white border-gray-300 text-gray-800 hover:border-gray-400"
                              }`}
                            title="Add to Wishlist"
                            aria-label={`Add ${item.title} to wishlist`}
                          >
                            {wishlistLoadingIds.has(item.id) ? "Adding..." : "Wishlist"}
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(item.id, item.title, item.variants);
                          }}
                          disabled={cartLoadingIds.has(item.id) || totalStock === 0}
                          className={`px-4 py-2.5 rounded-full font-semibold transition-all ${cartLoadingIds.has(item.id) || totalStock === 0
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-gray-900 hover:bg-black text-white shadow-sm"
                            }`}
                          title="Add to Cart"
                          aria-label={`Add ${item.title} to cart`}
                        >
                          {cartLoadingIds.has(item.id) ? "Adding..." : `Add to Cart${cart[item.id] ? ` (${cart[item.id]})` : ""}`}
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Bottom spacing */}
        <div className="h-10" />
      </section>
    </div>
  );
}