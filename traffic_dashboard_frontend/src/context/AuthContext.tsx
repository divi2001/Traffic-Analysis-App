// AuthContext.tsx
import { createContext, useState, ReactNode, useEffect } from "react";
import api, { setAuthToken } from "../api";

interface AuthContextType {
  user: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("🔍 Initializing AuthProvider...");
  const [user, setUser] = useState<string | null>(localStorage.getItem("user"));
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  

  useEffect(() => {
    console.log("🔄 useEffect triggered in AuthProvider.");
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      console.log("✅ Token found in localStorage:", storedToken);
      setToken(storedToken);  // This will trigger the effect again
      setAuthToken(storedToken);  // Set the token immediately
    } else {
      console.log("🚫 No token found in localStorage.");
    }
  }, []);  // Empty dependency array to run only once on mount

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      setToken(response.data.access_token);
      setUser(email);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", email);
      setAuthToken(response.data.access_token);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    
    console.log("Inside Register"); 
    try {
      const response = await api.post("/auth/register", { name, email, password });
      console.log("Registration Response:", response.data); 
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Registration Error:", error.message);
      } else {
        console.error("Unknown Error:", error);
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}