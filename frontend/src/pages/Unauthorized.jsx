// src/pages/Unauthorized.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="mb-4">You do not have permission to view this page.</p>
      <Link to="/" className="text-blue-500 underline">
        Return to Home
      </Link>
    </div>
  );
}
