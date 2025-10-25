import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import API from "../api/axios";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const normalizedRole = user?.role ? user.role.toLowerCase() : null;
  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const getHomeLink = () => {
    if (!user) return "/";
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "shopowner") return "/shop-owner";
    return "/";
  };

  // Route-based colors for non-public pages
  let pathKey = location.pathname;
  if (pathKey.startsWith("/dashboard")) pathKey = "/dashboard";
  else if (pathKey.startsWith("/admin")) pathKey = "/admin";

  const navColors = {
    "/login": "bg-gradient-to-r from-blue-500 to-purple-600",
    "/register": "bg-gradient-to-r from-green-400 to-blue-500",
    "/dashboard": "bg-gradient-to-r from-indigo-500 to-blue-700",
    "/admin": "bg-gradient-to-r from-red-500 to-pink-600",
    default: "bg-gradient-to-r from-blue-500 to-purple-600",
  };
  const currentGradient = navColors[pathKey] || navColors.default;

  // Public vs gradient variants
  const isPublicShell = !["/login", "/register", "/dashboard", "/admin"].includes(pathKey);

  // Notifications polling
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await API.get("/notifications");
          const unread = res.data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navBase = "fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200";
  const navColor =
    isPublicShell
      ? "bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 text-gray-900"
      : `${currentGradient} text-white`;

  const linkHover = isPublicShell ? "hover:text-gray-700" : "hover:text-gray-300";
  const iconHover = isPublicShell ? "hover:text-gray-700" : "hover:text-gray-300";
  const cartBadgeBg = isPublicShell ? "bg-blue-600" : "bg-red-600";

  return (
    <nav className={`${navBase} ${navColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand */}
          <div className="flex items-center">
            <Link
              to={getHomeLink()}
              className={`text-xl font-extrabold tracking-wide ${linkHover} transition whitespace-nowrap`}
            >
              Cart Stream
            </Link>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <div className="flex items-center space-x-4">
                {/* Cart */}
                <Link
                  to="/cart"
                  className={`relative p-2 ${iconHover} transition-colors`}
                  aria-label="View cart"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {totalCartItems > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 ${cartBadgeBg} rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                {/* Auth links */}
                {isPublicShell ? (
                  <>
                    <Link
                      to="/login"
                      className="px-3.5 py-2 rounded-full bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-medium transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-3.5 py-2 rounded-full bg-gray-900 text-white hover:bg-black font-medium transition-colors"
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={`${linkHover} transition-colors font-medium px-3 py-2`}>
                      Login
                    </Link>
                    <Link to="/register" className={`${linkHover} transition-colors font-medium px-3 py-2`}>
                      Register
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Optional: show unread dot (no route change) */}
                {unreadCount > 0 && (
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      isPublicShell ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-white/20 text-white"
                    }`}
                    title={`${unreadCount} unread notifications`}
                  >
                    {unreadCount} new
                  </div>
                )}
                <button
                  onClick={logout}
                  className={`px-4 py-2 rounded-md shadow-sm transition-colors font-medium whitespace-nowrap ${
                    isPublicShell
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`p-2 ${iconHover} transition-colors focus:outline-none`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className={`md:hidden py-3 space-y-2 rounded-b-xl ${
              isPublicShell
                ? "bg-white/90 backdrop-blur border-t border-gray-200 text-gray-900"
                : "border-t border-white/20"
            }`}
          >
            {!user ? (
              <>
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between hover:opacity-90 transition-colors font-medium py-2"
                >
                  <span>Cart</span>
                  {totalCartItems > 0 && (
                    <span
                      className={`ml-2 ${cartBadgeBg} rounded-full px-2 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {totalCartItems}
                    </span>
                  )}
                </Link>

                {isPublicShell ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black font-medium"
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:opacity-90 transition-colors font-medium py-2"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:opacity-90 transition-colors font-medium py-2"
                    >
                      Register
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div
                    className={`px-3 py-2 rounded-lg font-medium inline-flex items-center gap-2 ${
                      isPublicShell ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-white/20 text-white"
                    }`}
                  >
                    Notifications: {unreadCount}
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-white w-full text-left transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}