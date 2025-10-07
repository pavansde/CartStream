import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({
    title = "Dashboard",
    subtitle = "",
    tabs = [],
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    user = {},
    userRoleLabel = "",
}) {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if this is a customer (who uses route-based navigation)
    const isCustomer = user?.role?.toLowerCase() === "customer";

    // Handle tab navigation
    const handleTabClick = (tab) => {
        setActiveTab(tab.id);
        setSidebarOpen(false);

        if (isCustomer) {
            // Customer: Use route-based navigation
            switch (tab.id) {
                case "products":
                    navigate("/products");
                    break;
                case "my-orders":
                    navigate("/my-orders");
                    break;
                case "profile":
                    navigate("/profile");
                    break;
                case "cart":
                    navigate("/cart");
                    break;
                case "wishlist":
                    navigate("/wishlist");
                    break;
                case "notifications":
                    navigate("/notifications");
                    break;
                case "dashboard":
                    navigate("/dashboard");
                    break;
                default:
                    navigate("/");
            }
        }
        // For shop owners and admins, just setActiveTab (they handle rendering internally)
    };

    // Update active tab based on current route (only for customers)
    React.useEffect(() => {
        if (isCustomer) {
            const path = location.pathname;
            if (path.includes("/my-orders")) setActiveTab("my-orders");
            else if (path.includes("/profile")) setActiveTab("profile");
            else if (path.includes("/cart")) setActiveTab("cart");
            else if (path.includes("/wishlist")) setActiveTab("wishlist");
            else if (path.includes("/notifications")) setActiveTab("notifications");
            else if (path.includes("/dashboard")) setActiveTab("dashboard");
            else if (path.includes("/products") || path === "/") setActiveTab("products");
        }
    }, [location.pathname, setActiveTab, isCustomer]);

    return (
        <>
            {/* Mobile menu toggle button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Toggle sidebar"
                >
                    <span className="text-xl">☰</span>
                </button>
            </div>

            {/* Sidebar container with mouse enter/leave */}
            <div
                onMouseEnter={() => setSidebarCollapsed(false)}
                onMouseLeave={() => setSidebarCollapsed(true)}
                className={`fixed inset-y-0 left-0 z-40 bg-white shadow-xl transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${sidebarCollapsed ? "lg:w-20 w-64" : "lg:w-64 w-64"}
          lg:translate-x-0
          overflow-hidden`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div
                        className={`p-4 border-b border-gray-200 transition-all duration-300 ${sidebarCollapsed ? "text-center" : "flex items-center justify-between"
                            }`}
                    >
                        {!sidebarCollapsed ? (
                            <>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
                                    {subtitle && (
                                        <p className="text-gray-600 text-xs mt-1 truncate">{subtitle}</p>
                                    )}
                                </div>
                                {/* Empty space for balanced layout */}
                                <div className="w-8 flex-shrink-0" />
                            </>
                        ) : (
                            <div className="py-3" /> // placeholder height when collapsed
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab)}
                                className={`w-full flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center px-2" : "px-3"
                                    } py-3 rounded-lg text-left
                                ${activeTab === tab.id
                                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                                title={sidebarCollapsed ? tab.label : ""}
                                aria-current={activeTab === tab.id ? "page" : undefined}
                            >
                                <span
                                    className={`transition-all duration-300 ${sidebarCollapsed ? "text-lg mx-auto" : "text-lg mr-3"
                                        }`}
                                    aria-hidden="true"
                                >
                                    {tab.icon}
                                </span>
                                {!sidebarCollapsed && (
                                    <span className="font-medium text-sm transition-opacity duration-300 opacity-100">
                                        {tab.label}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* User Info Section - Fixed at bottom */}
                    <div className="flex-shrink-0 p-4 border-t border-gray-200">
                        <div
                            className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center" : "space-x-3"
                                }`}
                        >
                            <img
                                // src={user?.profile_picture || "images/headphoes.jpg"}
                                src={`http://127.0.0.1:8000${user.profile_picture}`}
                                alt={`${user?.username}'s avatar`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 transition-transform duration-300"
                            />
                            {!sidebarCollapsed && (
                                <div className="ml-2 text-left min-w-0 flex-1 transition-all duration-300 opacity-100">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.username}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {userRoleLabel}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}