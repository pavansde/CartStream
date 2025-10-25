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
  const apiBaseUrl = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomer = user?.role?.toLowerCase() === "customer";

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    setSidebarOpen(false);

    if (isCustomer) {
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
  };

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

  // Avatar helpers
  const avatarSrc =
    user?.profile_picture
      ? `${apiBaseUrl || ""}${user.profile_picture}`
      : null;
  const initials = (user?.username || "U").slice(0, 1).toUpperCase();

  // Only change collapse behavior on desktop hover
  const onEnter = () => {
    if (window.innerWidth >= 1024) setSidebarCollapsed(false);
  };
  const onLeave = () => {
    if (window.innerWidth >= 1024) setSidebarCollapsed(true);
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md border border-gray-200 hover:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
        >
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={[
          "fixed inset-y-0 left-0 z-50",
          "transition-all duration-300 ease-in-out",
          // Glassy surface + subtle border to match navbar/pages
          "bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-r border-gray-200 shadow-lg",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20 w-72" : "lg:w-72 w-72",
          "overflow-hidden",
        ].join(" ")}
        role="navigation"
        aria-label="Sidebar"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={[
              "px-4 py-4 border-b border-gray-200",
              "transition-all duration-300",
              sidebarCollapsed ? "text-center" : "flex items-center justify-between",
            ].join(" ")}
          >
            {!sidebarCollapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
                  {subtitle && <p className="text-gray-600 text-xs mt-0.5 truncate">{subtitle}</p>}
                </div>
                {/* Pin/Expand toggle (desktop) */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-pressed={sidebarCollapsed}
                >
                  {sidebarCollapsed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <div className="py-1.5">
                {/* Small pin in collapsed state (desktop) */}
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Expand sidebar"
                  aria-pressed={!sidebarCollapsed}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  title={sidebarCollapsed ? tab.label : ""}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group w-full flex items-center",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    "py-2.5 rounded-xl text-left transition-all duration-200",
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "transition-all duration-200",
                      sidebarCollapsed ? "text-lg mx-auto" : "text-lg mr-3",
                      isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span
                      className={[
                        "font-medium text-sm truncate",
                        isActive ? "text-white" : "text-gray-800",
                      ].join(" ")}
                    >
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User block */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div
              className={[
                "flex items-center",
                "transition-all duration-200",
                sidebarCollapsed ? "justify-center" : "gap-3",
              ].join(" ")}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${user?.username || "User"} avatar`}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.username || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{userRoleLabel}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}