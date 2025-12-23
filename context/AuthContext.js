import { login as apiLogin, logout as apiLogout, register as apiRegister, fetchUser } from "@/services/api";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

const restoreSession = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    
    // Ek check: Boş token'ları erken temizle
    if (!accessToken || !refreshToken || accessToken === '' || refreshToken === '') {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setIsAuthenticated(false);
      setUser(null);
      return;
    }
    
    setIsAuthenticated(true);
    setUser({ token: accessToken });
    
    try {
      const userData = await fetchUser();  // Bu, interceptor'ı tetikleyebilir (expired access için refresh)
      setUser({ ...userData, token: accessToken });
    } catch (error) {
      // console.error("Restore user fetch error:", error);  // Production'da Sentry gibi tool'a loglayın
      // CRITICAL: Hata durumunda (refresh fail dahil) token'ları temizle ve logout
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setIsAuthenticated(false);
      setUser(null);
      // Opsiyonel: Kullanıcıyı login'e yönlendir
      router.replace("/(auth)/Login");
    }
  } catch (error) {
    console.error("Session restore error:", error);
    setIsAuthenticated(false);
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

  const login = async (email, password) => {
    // console.log("login isteği geldi", email, password);
    const data = await apiLogin(email, password);
    // console.log("loginn",data)
    const { access } = data;
    const userData = await fetchUser();
    setUser({ ...userData, token: access });
    setIsAuthenticated(true);
    return data;
  };

  const register = async (fullName, email, phone, password, repassword) => {
    const formData = { full_name: fullName, e_posta: email, phone, password, repassword };
    try {
      await apiRegister(formData);
    } catch (registerError) {
      console.log("AuthContext register error:", registerError);
      throw registerError;
    }
    await login(email, password);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    router.replace("/(auth)/Login");
  };

  const updateUser = (userData) => {
    setUser({ ...userData, token: user?.token });
  };
  const loadUser = async () => {
    if (!isAuthenticated) return;  // Erken çık
    try {
      const userData = await fetchUser();
      setUser({ ...userData, token: user?.token });
      console.log("User loaded successfully");
    } catch (error) {
      // console.error("Load user error:", error);
      // 401 veya AUTH_EXPIRED ise auto-logout
      if (error.code === "AUTH_EXPIRED" || error.response?.status === 401) {
        console.log("Tokens expired – Auto logout");
        await logout();
      } else {
        // Diğer hatalarda toast göster (opsiyonel)
        // Toast.show({ type: 'error', text1: 'Kullanıcı yüklenemedi' });
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser,loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);