import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Validate token by making a test request
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  async function validateToken(token) {
    try {
      // First check if token is expired by parsing it
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        // Token is expired
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      // Do not mark authenticated until backend confirms
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          setUser(payload);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (backendError) {
        // Treat backend unavailability as not authenticated to avoid flashing dashboard
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }

  function login(token, userData) {
    try {
      localStorage.setItem("token", token);
      setUser(userData);
      setIsAuthenticated(true);
      console.log("Login successful:", userData);
      console.log("Auth state after login:", { user: userData, isAuthenticated: true });
    } catch (error) {
      console.error("Login storage error:", error);
      throw new Error("Failed to save login data");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      validateToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
