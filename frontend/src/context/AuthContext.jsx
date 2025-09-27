import React, { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("access_token"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refresh_token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /** Utility: Check token expiry */
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const { exp } = jwtDecode(token);
      return !exp || Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  /** Utility: Set Axios Authorization header */
  const setAxiosAuthToken = (token) => {
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common["Authorization"];
    }
  };

  /** Login */
  const login = useCallback((access, refresh, userData = null) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setAuthToken(access);
    setRefreshToken(refresh);
    setAxiosAuthToken(access);

    if (userData) {
      console.log("AuthContext.login() → setting user with role:", userData.role);
      const enrichedUser = { ...userData, fullProfileLoaded: true };
      localStorage.setItem("user", JSON.stringify(enrichedUser));
      setUser(enrichedUser);
    }
  }, []);

  /** Logout */
  const logout = useCallback(() => {
    localStorage.clear();
    setAuthToken(null);
    setRefreshToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    setAxiosAuthToken(null);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (user?.fullProfileLoaded) return;
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      const res = await API.get("/me");
      const mergedUser = {
        ...user,        // preserve old data
        ...res.data,    // latest server data overwrite (role, username, etc.)
        fullProfileLoaded: true,
      };
      console.log("fetchUserProfile() → merged user role:", mergedUser.role);

      localStorage.setItem("user", JSON.stringify(mergedUser));
      setUser(mergedUser);
    } catch (err) {
      console.error("Profile fetch failed:", err);
      logout();
    }
  }, [logout, user]);

  const attemptTokenRefresh = useCallback(async () => {
    try {
      const res = await API.post("/refresh/", { refresh: refreshToken });
      if (res.data?.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
        setAuthToken(res.data.access_token);
        setAxiosAuthToken(res.data.access_token);
        return res.data.access_token;
      } else {
        throw new Error("No access token in refresh response");
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
      logout();
      return null;
    }
  }, [refreshToken, logout]);

  /** Fetch notifications */
  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [authToken]);

  /** Mark notification as read */
  const markNotificationRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  /** Axios interceptor for auto-refresh on 401 */
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken
        ) {
          originalRequest._retry = true;
          const newAccess = await attemptTokenRefresh();
          if (newAccess) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
            return API(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, [attemptTokenRefresh, refreshToken]);

  /** App load / token change init */
  useEffect(() => {
    if (!authToken) {
      setAxiosAuthToken(null);
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (isTokenExpired(authToken)) {
      if (refreshToken && !isTokenExpired(refreshToken)) {
        attemptTokenRefresh().then((newAccess) => {
          if (newAccess) fetchUserProfile();
        });
      } else {
        logout();
      }
      return;
    }

    setAxiosAuthToken(authToken);
    fetchUserProfile();
  }, [authToken, refreshToken, fetchUserProfile, logout, attemptTokenRefresh]);

  /** Fetch notifications on user load, poll every 30s */
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        login,
        logout,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
