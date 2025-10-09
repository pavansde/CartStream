// import React, { useState } from "react";
// import API from "../api/axios";

// export default function Register() {
//   const [form, setForm] = useState({ username: "", email: "", password: "" });
//   const [success, setSuccess] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       await API.post("/users/", form);
//       setSuccess(
//         "Account created! Please check your inbox for a verification email. You can login after verifying."
//       );
//       setForm({ username: "", email: "", password: "" });
//     } catch (err) {
//       if (err.response && err.response.data?.detail) {
//         setError(err.response.data.detail);
//       } else {
//         setError("Registration failed. Try again.");
//       }
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-400 to-blue-500">
//       <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
//         <h2 className="text-3xl font-bold text-green-600 text-center mb-6">
//           Register
//         </h2>
//         {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
//         {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <input
//             placeholder="Username"
//             value={form.username}
//             onChange={(e) =>
//               setForm({ ...form, username: e.target.value })
//             }
//             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
//             required
//           />
//           <input
//             type="email"
//             placeholder="Email address"
//             value={form.email}
//             onChange={(e) =>
//               setForm({ ...form, email: e.target.value })
//             }
//             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
//             required
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={(e) =>
//               setForm({ ...form, password: e.target.value })
//             }
//             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
//             required
//           />
//           <button
//             type="submit"
//             className="w-full bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition"
//             disabled={loading}
//           >
//             {loading ? "Registering..." : "Register"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import API from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-green-600 text-center mb-6">
          Register
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mb-4 text-center">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
            required
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleEmailChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
              emailError ? "border-red-500 focus:ring-red-300" : "focus:ring-green-300"
            }`}
            required
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handlePasswordChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
              passwordError ? "border-red-500 focus:ring-red-300" : "focus:ring-green-300"
            }`}
            required
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
          <button
            type="submit"
            className={`w-full text-white font-semibold py-2 rounded-lg transition ${
              isSubmitDisabled ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={isSubmitDisabled}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
