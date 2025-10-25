import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

export default function Login() {
  const { login, authToken, user } = useContext(AuthContext);
  const { mergeGuestCart } = useContext(CartContext);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/login/", { identifier, password });

      if (res.data?.access_token && res.data?.refresh_token) {
        const userData = res.data.user || null;

        // AuthContext -> set tokens and user
        login(res.data.access_token, res.data.refresh_token, userData);

        // Merge guest cart with the new token
        await mergeGuestCart(res.data.access_token);

        // If coming from checkout, go back there
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Left: Hero */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1920&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/10" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 text-white">
          <header className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-extrabold tracking-tight">
              Cart Stream
            </Link>
          </header>

          <div>
            <span className="text-white/80 text-xs uppercase tracking-widest">Welcome Back</span>
            <h1 className="mt-2 text-4xl leading-tight font-extrabold max-w-lg">
              Sign in to continue shopping
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              Access your wishlist, track orders, and enjoy a faster checkout.
            </p>
          </div>

          <div className="text-sm text-white/70">
            © {new Date().getFullYear()} Cart Stream. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
            <p className="mt-1 text-gray-600 text-sm">
              Use your email or mobile number to sign in.
            </p>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Identifier */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14v7m-7-7a7 7 0 1114 0"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Email address or Mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.943 0 1.714-.771 1.714-1.714V7.714C13.714 6.771 12.943 6 12 6s-1.714.771-1.714 1.714v1.572C10.286 10.229 11.057 11 12 11z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10v7a3 3 0 003 3h6a3 3 0 003-3v-7" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.216.217-2.383.615-3.465M9.878 9.878a3 3 0 104.243 4.243M6.1 6.1L18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm" />
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white py-2.5 transition shadow-sm ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Register here
              </Link>
            </p>

            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
                </svg>
                Back to home
              </Link>
            </div>
          </div>

          {/* Small footer for mobile */}
          <div className="mt-6 text-center text-xs text-gray-500 lg:hidden">
            © {new Date().getFullYear()} Cart Stream. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}