import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import CustomerCheckout from "./pages/CustomerCheckout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicItemsPage from "./pages/PublicItemsPage";
import Unauthorized from "./pages/Unauthorized";
import Notifications from "./pages/Notifications";
import Wishlist from "./pages/wishlist";
import MyOrders from "./pages/MyOrders";
import ShopOwnerOrders from "./pages/ShopOwnerOrders";
import Dashboard from "./pages/Dashboard";
import CartPage from "./pages/CartPage";

import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useCartSync } from "./context/useCartSync"; // Import the custom hook

// ProtectedRoute supports multiple allowed roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, authToken } = useContext(AuthContext);
  const location = useLocation();

  if (authToken && !user) {
    return (
      <div className="p-6 text-center font-semibold text-gray-600">
        Loading user details...
      </div>
    );
  }

  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedUserRole = user.role?.toLowerCase();

  if (
    allowedRoles &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(normalizedUserRole)
  ) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        🚫 Access Denied — You do not have permission to view this page.
      </div>
    );
  }

  return children;
};

// Move useCartSync inside this component so it's wrapped by providers
function AppInner() {
  useCartSync();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public product browsing */}
        <Route path="/" element={<PublicItemsPage />} />

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Shop Owner + Admin */}
        <Route
          path="/shop-owner"
          element={
            <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
              <ShopOwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer only */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerCheckout />
            </ProtectedRoute>
          }
        />

        {/* Customer Cart */}
        <Route path="/cart" element={<CartPage />} />


        {/* Notifications accessible to all logged-in roles */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Wishlist accessible to all logged-in roles */}
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        {/* My Orders (Customer) */}
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <MyOrders />
            </ProtectedRoute>
          }
        />

        {/* Shop Owner Orders */}
        <Route
          path="/shop-owner/orders"
          element={
            <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
              <ShopOwnerOrders />
            </ProtectedRoute>
          }
        />

        {/* Customer Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all 404 */}
        <Route
          path="*"
          element={
            <div className="p-6 text-center font-semibold text-gray-600">
              404 — Page Not Found
            </div>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppInner />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
