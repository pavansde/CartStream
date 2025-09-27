import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login, authToken, user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in & role is known
  useEffect(() => {
    if (authToken && user?.role) {
      redirectByRole(user.role);
    }
  }, [authToken, user]);

  const redirectByRole = (role) => {
    const roleRoutes = {
      Admin: "/admin",
      ShopOwner: "/shop-owner",
      Customer: "/customer",
    };
    navigate(roleRoutes[role] || "/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/login/", { email, password });

      if (res.data?.access_token && res.data?.refresh_token) {
        const userData = res.data.user || null;

        // Save tokens and user in context
        await login(res.data.access_token, res.data.refresh_token, userData);

        // Redirect immediately based on role
        if (userData?.role) {
          redirectByRole(userData.role);
        }
      } else {
        setError("Login failed — server did not return both tokens.");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || "Invalid email or password");
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
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">
          Login
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-center" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className={`w-full ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white font-semibold py-2 rounded-lg transition`}
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


