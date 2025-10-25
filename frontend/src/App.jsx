// import { useContext } from "react";
// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   Navigate,
//   useLocation,
// } from "react-router-dom";
// import { ToastProvider } from './context/ToastContext';
// import Toast from './components/Toast';
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import AdminPanel from "./pages/AdminPanel";
// import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
// import CustomerCheckout from "./pages/CustomerCheckout";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
// import PublicItemsPage from "./pages/PublicItemsPage";
// import ProductDetail from "./pages/ProductDetail";
// import Unauthorized from "./pages/Unauthorized";
// import Notifications from "./pages/Notifications";
// import Wishlist from "./pages/wishlist";
// import MyOrders from "./pages/MyOrders";
// import ShopOwnerOrders from "./pages/ShopOwnerOrders";
// import CartPage from "./pages/CartPage";
// import UserProfile from "./components/UserProfile";
// import CustomerLayout from "./components/CustomerLayout";
// import VerifyEmail from "./components/VerifyEmail";

// import Navbar from "./components/Navbar";
// import { AuthProvider, AuthContext } from "./context/AuthContext";
// import { CartProvider } from "./context/CartContext";
// import { useCartSync } from "./context/useCartSync";

// // ProtectedRoute supports multiple allowed roles
// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const { user, authToken } = useContext(AuthContext);
//   const location = useLocation();

//   if (authToken && !user) {
//     return (
//       <div className="p-6 text-center font-semibold text-gray-600">
//         Loading user details...
//       </div>
//     );
//   }

//   if (!authToken || !user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   const normalizedUserRole = user.role?.toLowerCase();

//   if (
//     allowedRoles &&
//     !allowedRoles.map((r) => r.toLowerCase()).includes(normalizedUserRole)
//   ) {
//     return (
//       <div className="p-6 text-center text-red-500 font-semibold">
//         🚫 Access Denied — You do not have permission to view this page.
//       </div>
//     );
//   }

//   return children;
// };

// // Move useCartSync inside this component so it's wrapped by providers
// function AppInner() {
//   useCartSync();

//   return (
//     <>
//       <Navbar />
//       <div className="pt-16">
//         <Routes>
//           {/* Public product browsing - with CustomerLayout for customers */}
//           <Route
//             path="/"
//             element={
//               <CustomerLayout title="All Products">
//                 <PublicItemsPage />
//               </CustomerLayout>
//             }
//           />
//           <Route path="/items/:id" element={<ProductDetail />} />

//           {/* Public auth routes */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/reset-password" element={<ResetPassword />} />

//           {/* Admin-only */}
//           <Route
//             path="/admin"
//             element={
//               <ProtectedRoute allowedRoles={["admin"]}>
//                 <AdminPanel />
//               </ProtectedRoute>
//             }
//           />

//           {/* Profile with CustomerLayout for customers */}
//           <Route
//             path="/profile"
//             element={
//               <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
//                 <CustomerLayout title="My Profile">
//                   <UserProfile />
//                 </CustomerLayout>
//               </ProtectedRoute>
//             }
//           />

//           {/* Shop Owner + Admin */}
//           <Route
//             path="/shop-owner"
//             element={
//               <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
//                 <ShopOwnerDashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* Customer only - Checkout (usually doesn't need sidebar) */}
//           <Route
//             path="/checkout"
//             element={
//               <ProtectedRoute allowedRoles={["customer"]}>
//                 <CustomerCheckout />
//               </ProtectedRoute>
//             }
//           />

//           {/* Customer Cart - with CustomerLayout */}
//           <Route
//             path="/cart"
//             element={
//               <CustomerLayout title="My Cart">
//                 <CartPage />
//               </CustomerLayout>
//             }
//           />

//           {/* Notifications accessible to all logged-in roles - with CustomerLayout for customers */}
//           <Route
//             path="/notifications"
//             element={
//               <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
//                 <CustomerLayout title="Notifications">
//                   <Notifications />
//                 </CustomerLayout>
//               </ProtectedRoute>
//             }
//           />

//           {/* Wishlist accessible to all logged-in roles - with CustomerLayout for customers */}
//           <Route
//             path="/wishlist"
//             element={
//               <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
//                 <CustomerLayout title="My Wishlist">
//                   <Wishlist />
//                 </CustomerLayout>
//               </ProtectedRoute>
//             }
//           />

//           {/* My Orders (Customer) - with CustomerLayout */}
//           <Route
//             path="/my-orders"
//             element={
//               <ProtectedRoute allowedRoles={["customer"]}>
//                 <CustomerLayout title="My Orders">
//                   <MyOrders />
//                 </CustomerLayout>
//               </ProtectedRoute>
//             }
//           />

//           {/* Shop Owner Orders */}
//           <Route
//             path="/shop-owner/orders"
//             element={
//               <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
//                 <ShopOwnerOrders />
//               </ProtectedRoute>
//             }
//           />


//           {/* Products page - with CustomerLayout for customers */}
//           <Route
//             path="/products"
//             element={
//               <CustomerLayout title="All Products">
//                 <PublicItemsPage />
//               </CustomerLayout>
//             }
//           />

//           <Route path="/verify-email" element={<VerifyEmail />} />


//           {/* Unauthorized page */}
//           <Route path="/unauthorized" element={<Unauthorized />} />

//           {/* Catch-all 404 */}
//           <Route
//             path="*"
//             element={
//               <div className="p-6 text-center font-semibold text-gray-600">
//                 404 — Page Not Found
//               </div>
//             }
//           />
//         </Routes>
//       </div>
//     </>
//   );
// }

// function App() {
//   return (
//     <ToastProvider>
//     <AuthProvider>
//       <CartProvider>
//         <Router>
//           <AppInner />
//           <Toast />
//         </Router>
//       </CartProvider>
//     </AuthProvider>
//     </ToastProvider>
//   );
// }

// export default App;


import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import CustomerCheckout from "./pages/CustomerCheckout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicItemsPage from "./pages/PublicItemsPage";
import ProductDetail from "./pages/ProductDetail";
import Unauthorized from "./pages/Unauthorized";
import Notifications from "./pages/Notifications";
import Wishlist from "./pages/wishlist";
import MyOrders from "./pages/MyOrders";
import ShopOwnerOrders from "./pages/ShopOwnerOrders";
import CartPage from "./pages/CartPage";
import UserProfile from "./components/UserProfile";
import CustomerLayout from "./components/CustomerLayout";
import VerifyEmail from "./components/VerifyEmail";

import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useCartSync } from "./context/useCartSync";

/* -------------------- Protected Route -------------------- */
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
  if (allowedRoles && !allowedRoles.map((r) => r.toLowerCase()).includes(normalizedUserRole)) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">
        🚫 Access Denied — You do not have permission to view this page.
      </div>
    );
  }

  return children;
};

/* -------------------- Layouts (Navbar lives here) -------------------- */
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <div className="pt-16">{children}</div>
  </>
);

// Compose Navbar with your existing CustomerLayout
const CustomerShell = ({ title, children }) => (
  <>
    <Navbar />
    <div className="pt-16">
      <CustomerLayout title={title}>{children}</CustomerLayout>
    </div>
  </>
);

// Simple admin/owner wrapper with Navbar
const AdminLayout = ({ children }) => (
  <>
    <Navbar />
    <div className="pt-16">{children}</div>
  </>
);

/* -------------------- AppInner -------------------- */
function AppInner() {
  useCartSync();

  return (
    <Routes>
      {/* Public product browsing with CustomerShell */}
      <Route
        path="/"
        element={
          <CustomerShell title="All Products">
            <PublicItemsPage />
          </CustomerShell>
        }
      />
      <Route
        path="/products"
        element={
          <CustomerShell title="All Products">
            <PublicItemsPage />
          </CustomerShell>
        }
      />
      <Route
        path="/items/:id"
        element={
          <PublicLayout>
            <ProductDetail />
          </PublicLayout>
        }
      />

      {/* Public auth routes (NO navbar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Admin-only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout>
              <AdminPanel />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile (customer/admin/shopowner) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
            <CustomerShell title="My Profile">
              <UserProfile />
            </CustomerShell>
          </ProtectedRoute>
        }
      />

      {/* Shop Owner + Admin */}
      <Route
        path="/shop-owner"
        element={
          <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
            <AdminLayout>
              <ShopOwnerDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Customer-only Checkout (no sidebar but keep navbar) */}
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <PublicLayout>
              <CustomerCheckout />
            </PublicLayout>
          </ProtectedRoute>
        }
      />

      {/* Cart (customer layout) */}
      <Route
        path="/cart"
        element={
          <CustomerShell title="My Cart">
            <CartPage />
          </CustomerShell>
        }
      />

      {/* Notifications (all roles) with customer shell */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
            <CustomerShell title="Notifications">
              <Notifications />
            </CustomerShell>
          </ProtectedRoute>
        }
      />

      {/* Wishlist (all roles) */}
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute allowedRoles={["admin", "shopowner", "customer"]}>
            <CustomerShell title="My Wishlist">
              <Wishlist />
            </CustomerShell>
          </ProtectedRoute>
        }
      />

      {/* My Orders (Customer) */}
      <Route
        path="/my-orders"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerShell title="My Orders">
              <MyOrders />
            </CustomerShell>
          </ProtectedRoute>
        }
      />

      {/* Shop Owner Orders */}
      <Route
        path="/shop-owner/orders"
        element={
          <ProtectedRoute allowedRoles={["shopowner", "admin"]}>
            <AdminLayout>
              <ShopOwnerOrders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="p-6 text-center font-semibold text-gray-600">
            404 — Page Not Found
          </div>
        }
      />
    </Routes>
  );
}

/* -------------------- App root with providers -------------------- */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppInner />
            <Toast />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;