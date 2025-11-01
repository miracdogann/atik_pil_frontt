import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./endpoints";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await SecureStore.setItemAsync("accessToken", access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed:", refreshError);  // Detaylı log
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        
        // Özel hata: AuthContext'te yakalanabilir
        const authError = new Error("AUTH_EXPIRED");
        authError.code = "AUTH_EXPIRED";
        return Promise.reject(authError);  // Bu, üst katmanlarda yakalanabilir
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;