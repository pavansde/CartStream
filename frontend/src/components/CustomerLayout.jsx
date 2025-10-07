import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function CustomerLayout({ children, title = "Customer Dashboard" }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // Sidebar tabs configuration
  const customerTabs = [
    {
      id: "products",
      label: "All Products",
      icon: "🛍️",
    },
    {
      id: "my-orders",
      label: "My Orders",
      icon: "📦",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: "👤",
    },
    {
      id: "cart",
      label: "My Cart",
      icon: "🛒",
    },
    {
      id: "wishlist",
      label: "Wishlist",
      icon: "❤️",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
    },
  ];

  // Determine active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/my-orders")) setActiveTab("my-orders");
    else if (path.includes("/profile")) setActiveTab("profile");
    else if (path.includes("/cart")) setActiveTab("cart");
    else if (path.includes("/wishlist")) setActiveTab("wishlist");
    else if (path.includes("/notifications")) setActiveTab("notifications");
    else if (path.includes("/dashboard")) setActiveTab("dashboard");
    else setActiveTab("products"); // Default for /products and /
  }, [location.pathname]);

  // If user is not a customer, don't show sidebar but still render children
  if (!user || user.role !== "customer") {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for customers only */}
      <Sidebar
        title={title}
        subtitle="Manage your account"
        tabs={customerTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        user={user}
        userRoleLabel="Customer"
      />

      {/* Main Content Area - Full height and width utilization */}
<div className={`flex-1 flex flex-col min-h-screen transition-all duration-400 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile menu button - Only shown on mobile */}
        <div className="lg:hidden flex-shrink-0 p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center mr-8">
              {title}
            </h1>
          </div>
        </div>

        {/* Page Content - Takes all remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Optional: Page header for desktop */}
          <div className="hidden lg:block flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {title !== "Customer Dashboard" && (
              <p className="text-gray-600 mt-1">Manage your account and shopping experience</p>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto">
            <div className="h-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}