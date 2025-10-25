// // src/pages/ForgotPassword.js
// import { useState } from "react";

// export default function ForgotPassword() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const apiBaseUrl = process.env.REACT_APP_API_URL


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const res = await fetch(`${apiBaseUrl}/forgot-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email })
//     });
//     const data = await res.json();
//     setMessage(data.message);
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold">Forgot Password</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <input
//           type="email"
//           placeholder="Enter your registered email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border p-2 w-full"
//         />
//         <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
//           Send Reset Link
//         </button>
//       </form>
//       {message && <p className="mt-4 text-green-600">{message}</p>}
//     </div>
//   );
// }

import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");     // success message
  const [error, setError] = useState("");         // error message
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError(validateEmail(val) ? "" : "Enter a valid email address");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send reset link");
      }

      setMessage(data?.message || "If the email exists, a reset link has been sent.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !!emailError || !email;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Left Hero */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1520975672230-8d08a43d4d3b?q=80&w=1920&auto=format&fit=crop')",
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
              Forgot Password
            </span>
            <h1 className="mt-2 text-4xl leading-tight font-extrabold max-w-lg">
              Don’t worry, we’ve got you
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              Enter your email and we’ll send you a secure link to reset your password.
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
            <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-1 text-gray-600 text-sm">
              We’ll email you a link to create a new password.
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

            {message && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 text-sm"
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white py-2.5 transition shadow-sm ${
                  isDisabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Back to Login
              </Link>
              <Link to="/" className="text-gray-600 hover:text-gray-800">
                Back to Home
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