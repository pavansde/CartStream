import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";  // Import CartContext
import API from "../api/axios";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);  // Access cart from Context
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedRole = user?.role ? user.role.toLowerCase() : null;

  // Calculate total items count in cart
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
    <nav className={`${currentColor} text-white shadow-lg transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <Link to="/" className="text-xl font-extrabold tracking-wide hover:opacity-85 transition">
          Cart Stream
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex space-x-6 items-center">

          {/* Always show cart icon for customers */}
          {( !user || (user && user.role === "customer") ) && (
            <Link to="/cart" className="relative hover:text-gray-300" aria-label="View cart">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m4-9l2 9"
                />
              </svg>
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 rounded-full px-1.5 text-xs font-bold text-white">
                  {totalCartItems}
                </span>
              )}
            </Link>
          )}


          {!user ? (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          ) : (
            <>
              {/* Role-based links */}
              {normalizedRole === "shopowner" && (
                <>
                  <Link to="/shop-owner" className="hover:underline">Dashboard</Link>
                  <Link to="/shop-owner/orders" className="hover:underline">Orders</Link>
                </>
              )}
              {normalizedRole === "customer" && (
                <>
                  <Link to="/my-orders" className="hover:underline">My Orders</Link>
                  <Link to="/wishlist" className="hover:underline">Wishlist</Link>
                </>
              )}
              {normalizedRole === "admin" && (
                <>
                  <Link to="/admin" className="hover:underline">Dashboard</Link>
                </>
              )}

              {/* Notifications Bell */}
              {user && user.role !== "admin" && (
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative focus:outline-none"
                  aria-label="View Notifications"
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
                      d="M15 17h5l-1.4-1.4A2.005 2.005 0 0118 14.2V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.8v5.4c0 .53-.21 1.04-.586 1.414L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 rounded-full px-1 text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md shadow-sm transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
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

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={`${currentColor} md:hidden px-4 py-3 space-y-2`}>
          {!user ? (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block hover:underline">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block hover:underline">
                Register
              </Link>
            </>
          ) : (
            <>
              {normalizedRole === "shopowner" && (
                <>
                  <Link to="/shop-owner" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/shop-owner/orders" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Orders
                  </Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Wishlist
                  </Link>
                </>
              )}
              {normalizedRole === "customer" && (
                <>
                  <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    My Orders
                  </Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Wishlist
                  </Link>
                </>
              )}
              {normalizedRole === "admin" && (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Admin
                  </Link>
                  <Link to="/shop-owner/orders" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Orders
                  </Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block hover:underline">
                    Wishlist
                  </Link>
                </>
              )}
              <Link
                to="/notifications"
                onClick={() => setMenuOpen(false)}
                className="block relative hover:underline"
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 rounded-full px-2 py-0.5 text-xs">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-white w-full text-left"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
