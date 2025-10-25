import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState(""); // success
  const [error, setError] = useState("");     // error
  const [loading, setLoading] = useState(false);

  const [pwdError, setPwdError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  // Basic password rule: 8+ chars, at least one letter and one number
  const validatePassword = (pw) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

  // Simple strength indicator
  const strength = useMemo(() => {
    const s = { score: 0, label: "Weak" };
    if (!newPassword) return s;
    const hasLen = newPassword.length >= 8;
    const hasNum = /\d/.test(newPassword);
    const hasLet = /[A-Za-z]/.test(newPassword);
    const hasSym = /[^A-Za-z0-9]/.test(newPassword);
    s.score = [hasLen, hasNum, hasLet, hasSym].filter(Boolean).length;
    s.label = s.score <= 2 ? "Weak" : s.score === 3 ? "Medium" : "Strong";
    return s;
  }, [newPassword]);

  const handleNewPassword = (e) => {
    const val = e.target.value;
    setNewPassword(val);
    setMessage("");
    setError("");
    if (!validatePassword(val)) {
      setPwdError("Min 8 characters with letters and numbers");
    } else {
      setPwdError("");
    }
    if (confirm) {
      setConfirmError(val === confirm ? "" : "Passwords do not match");
    }
  };

  const handleConfirm = (e) => {
    const val = e.target.value;
    setConfirm(val);
    setMessage("");
    setError("");
    setConfirmError(val === newPassword ? "" : "Passwords do not match");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Missing or invalid reset link. Please request a new one.");
      return;
    }
    if (!validatePassword(newPassword)) {
      setPwdError("Min 8 characters with letters and numbers");
      return;
    }
    if (confirm !== newPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || "Failed to reset password");
      }
      setMessage(data?.message || "Password updated successfully. You can now log in.");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    !newPassword ||
    !confirm ||
    !!pwdError ||
    !!confirmError ||
    !validatePassword(newPassword) ||
    confirm !== newPassword ||
    !token;

  const strengthBarClass =
    strength.score <= 2
      ? "bg-red-500"
      : strength.score === 3
      ? "bg-yellow-500"
      : "bg-emerald-600";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Left Hero */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=1920&auto=format&fit=crop')",
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
              Reset Password
            </span>
            <h1 className="mt-2 text-4xl leading-tight font-extrabold max-w-lg">
              Create a new password
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              Choose a strong password to keep your account secure.
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
            <h2 className="text-2xl font-bold text-gray-900">Set your new password</h2>
            {!token && (
              <p className="mt-1 text-red-600 text-sm">
                Your reset link is missing or invalid. Please{" "}
                <Link to="/forgot-password" className="underline">
                  request a new one
                </Link>
                .
              </p>
            )}

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
              {/* New password */}
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
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={handleNewPassword}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    pwdError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
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
                {pwdError && <p className="text-red-600 text-sm mt-1">{pwdError}</p>}
              </div>

              {/* Strength */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strengthBarClass} transition-all`}
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                    }}
                  />
                </div>
                {newPassword && (
                  <span
                    className={`text-xs ${
                      strength.score <= 2
                        ? "text-red-600"
                        : strength.score === 3
                        ? "text-yellow-600"
                        : "text-emerald-600"
                    }`}
                  >
                    Strength: {strength.label}
                  </span>
                )}
              </div>

              {/* Confirm password */}
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
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={handleConfirm}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    confirmError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? (
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
                {confirmError && <p className="text-red-600 text-sm mt-1">{confirmError}</p>}
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-white py-2.5 transition shadow-sm ${
                  isDisabled ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/login" className="text-emerald-600 hover:text-emerald-800">
                Back to Login
              </Link>
              <Link to="/forgot-password" className="text-gray-600 hover:text-gray-800">
                Request new link
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