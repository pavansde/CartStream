import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const getHomeLink = () => {
    if (!user) return "/";
    if (normalizedRole === "admin") return "/admin";
    if (normalizedRole === "shopowner") return "/shop-owner";
    return "/";
  };

  const normalizedRole = user?.role ? user.role.toLowerCase() : null;
  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Route-based colors
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
  const currentColor = navColors[pathKey] || navColors.default;

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

  return (
    <nav className={`${currentColor} text-white shadow-lg fixed top-0 left-0 right-0 z-50 w-full`}>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Brand/Logo */}
          <div className="flex items-center">
            <Link 
              to={getHomeLink()} 
              className="text-xl font-extrabold tracking-wide hover:opacity-85 transition whitespace-nowrap"
            >
              Cart Stream
            </Link>
          </div>

          {/* Desktop menu - Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              // Show cart icon and login/register for non-logged in users
              <div className="flex items-center space-x-4">
                {/* Cart icon for non-logged in users */}
                <Link to="/cart" className="relative p-2 hover:text-gray-300 transition-colors" aria-label="View cart">
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
                    <span className="absolute -top-1 -right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
                <Link to="/login" className="hover:text-gray-300 transition-colors font-medium px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="hover:text-gray-300 transition-colors font-medium px-3 py-2">
                  Register
                </Link>
              </div>
            ) : (
              // For logged-in users: ONLY show logout button
              <div className="flex items-center space-x-4">
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md shadow-sm transition-colors font-medium whitespace-nowrap"
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
              className="p-2 hover:text-gray-300 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
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
          <div className="md:hidden border-t border-blue-400 py-3 space-y-2">
            {!user ? (
              // Mobile menu for non-logged in users
              <>
                {/* Cart in mobile menu for non-logged in users */}
                <Link 
                  to="/cart" 
                  onClick={() => setMenuOpen(false)} 
                  className="flex items-center hover:text-gray-300 transition-colors font-medium py-2"
                >
                  Cart
                  {totalCartItems > 0 && (
                    <span className="ml-2 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
                <Link 
                  to="/login" 
                  onClick={() => setMenuOpen(false)} 
                  className="block hover:text-gray-300 transition-colors font-medium py-2"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMenuOpen(false)} 
                  className="block hover:text-gray-300 transition-colors font-medium py-2"
                >
                  Register
                </Link>
              </>
            ) : (
              // Mobile menu for logged-in users: ONLY show logout
              <>
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