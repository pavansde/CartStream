// import React, { useContext } from "react";
// import { Navigate, Outlet, useLocation } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";

// export default function ProtectedRoute({ allowedRoles }) {
//   const { authToken, user } = useContext(AuthContext);
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

//   const roleMatch =
//     !allowedRoles ||
//     allowedRoles.some(
//       (role) => role.toLowerCase() === user.role?.toLowerCase()
//     );

//   if (!roleMatch) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return <Outlet />;
// }

import React, { useContext, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { authToken, user, fetchNotifications } = useContext(AuthContext);
  const location = useLocation();

  // Pre-fetch notifications on user load for specified roles
  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "shop_owner")) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  if (authToken && !user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        Loading user details...
      </div>
    );
  }

  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleMatch =
    !allowedRoles ||
    allowedRoles.some(
      (role) => role.toLowerCase() === user.role?.toLowerCase()
    );

  if (!roleMatch) {
    console.warn(
      `Access denied: user role "${user.role}" not in allowedRoles [${allowedRoles}]`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
