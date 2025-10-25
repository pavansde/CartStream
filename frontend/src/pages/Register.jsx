import { useState } from "react";
import API from "../api/axios";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation state
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Simple email regex validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Password validation: min 8 chars with at least one number and one letter
  const validatePassword = (password) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return re.test(password);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setForm({ ...form, email });
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setForm({ ...form, password });
    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include letters and numbers"
      );
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Final validation before submit
    if (!validateEmail(form.email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!validatePassword(form.password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include letters and numbers"
      );
      return;
    }

    setLoading(true);
    try {
      await API.post("/users/", form);
      setSuccess(
        "Account created! Please check your inbox for a verification email. You can login after verifying."
      );
      setForm({ username: "", email: "", password: "" });
    } catch (err) {
      if (err.response && err.response.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Registration failed. Try again.");
      }
    }
    setLoading(false);
  };

  // Disable submit if validation errors present
  const isSubmitDisabled =
    loading || emailError.length > 0 || passwordError.length > 0;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Left Hero */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1920&auto=format&fit=crop')",
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
            <span className="text-white/80 text-xs uppercase tracking-widest">
              Start your journey
            </span>
            <h1 className="mt-2 text-4xl leading-tight font-extrabold max-w-lg">
              Create your account in seconds
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              Track orders, save items to your wishlist, and enjoy a faster checkout.
            </p>
          </div>

          <div className="text-sm text-white/70">
            © {new Date().getFullYear()} Cart Stream. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-1 text-gray-600 text-sm">Join us and start shopping smarter.</p>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-2 text-sm"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* Username */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4 4-4-4m8-4H8" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-transparent"
                  }`}
                  required
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
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
                  value={form.password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    passwordError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-500 focus:border-transparent"
                  }`}
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
                {passwordError && (
                  <p className="text-red-600 text-sm mt-1">{passwordError}</p>
                )}
              </div>

              <button
                type="submit"
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white py-2.5 transition shadow-sm ${
                  isSubmitDisabled ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                disabled={isSubmitDisabled}
              >
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-top-transparent border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
                Login
              </Link>
            </p>

            <div className="mt-6">
              <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800">
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