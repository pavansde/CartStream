import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { addOrUpdateCartItem } from "../api/cart";

export default function Login() {
  const { login, authToken, user } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState(""); // Renamed from 'email'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginRedirected, setLoginRedirected] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || null;
  const cartItems = location.state?.cartItems || [];

  useEffect(() => {
    if (!loginRedirected && authToken && user?.role) {
      redirectByRole(user.role);
    }
  }, [authToken, user, loginRedirected]);

  const redirectByRole = (role) => {
    const normalizedRole = role.toLowerCase();
    const roleRoutes = {
      admin: "/admin",
      shopowner: "/shop-owner",
      customer: "/",
    };
    navigate(roleRoutes[normalizedRole] || "/");
  };

  const mergeGuestCart = async (token) => {
    try {
      const guestCart = JSON.parse(localStorage.getItem("cart") || "{}");

      if (Object.keys(guestCart).length === 0) {
        console.log("🛒 No guest cart items to merge");
        return;
      }

      console.log("🔄 Merging guest cart with backend cart:", guestCart);

      // Merge each guest cart item
      for (const [cartKey, cartItem] of Object.entries(guestCart)) {
        try {
          console.log(`➕ Merging guest item: ${cartKey}`, cartItem);

          // Use the correct payload structure with variant_id
          await addOrUpdateCartItem({
            item_id: cartItem.itemId,
            variant_id: cartItem.variantId, // Include variant_id
            quantity: cartItem.quantity
          }, token);

          console.log(`✅ Successfully merged: ${cartKey}`);
        } catch (error) {
          console.error(`❌ Failed to merge ${cartKey}:`, error);
          // Don't throw - continue with other items
          if (error.response?.status === 422) {
            console.error("🔴 422 Validation Error Details:", error.response.data);
          }
        }
      }

      // Clear guest cart after merge attempt
      localStorage.setItem("cart", JSON.stringify({}));
      console.log("✅ Guest cart merge completed");

    } catch (error) {
      console.error("❌ Failed to merge guest cart:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pass 'identifier' instead of 'email'
      const res = await API.post("/login/", { identifier, password });

      if (res.data?.access_token && res.data?.refresh_token) {
        const userData = res.data.user || null;

        // Call AuthContext login first
        login(res.data.access_token, res.data.refresh_token, userData);

        // Then merge guest cart with the new token
        await mergeGuestCart(res.data.access_token);

        // Handle redirects
        if (from === "/checkout") {
          navigate("/checkout", { state: { cartItems }, replace: true });
          setLoginRedirected(true);
          return;
        }

        if (userData?.role) {
          redirectByRole(userData.role);
        }
      } else {
        setError("Login failed — server did not return both tokens.");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || "Invalid credentials");
      } else if (err.request) {
        setError("No response from server.");
      } else {
        setError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-400 to-purple-500">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">Login</h2>

        {error && (
          <p className="text-red-500 mb-4 text-center" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" // Changed from "email" to "text"
            placeholder="Email address or Mobile number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
            required
          />
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold py-2 rounded-lg transition`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}