// services/api.js
import * as SecureStore from "expo-secure-store";
import apiClient from "./apiClient";
import { AUTH_ENDPOINTS, ENDPOINTS } from "./endpoints"; // endpoints'ten sabitler

export const register = async (data) => {
  console.log("api.js, register data", data);
  try {
    const res = await apiClient.post(AUTH_ENDPOINTS.REGISTER, data);
    if (res.status !== 201) {
      const errorBody = res.data || 'No body';
      throw new Error(`Register failed: ${JSON.stringify(errorBody)}`);
    }
    return res.data;
  } catch (error) {
    console.log("api.js register error full:", error.response?.data || error.response || error.message);
    throw error;
  }
};

export const login = async (email, password) => {
  console.log("api.js, login data", { e_posta: email, password });
  const res = await apiClient.post(AUTH_ENDPOINTS.LOGIN, {
    e_posta: email,
    password: password,
  });
  const { access, refresh } = res.data;
  await SecureStore.setItemAsync("accessToken", access);
  await SecureStore.setItemAsync("refreshToken", refresh);
  return res.data;
};

export const fetchUser = async () => {
  const res = await apiClient.get(AUTH_ENDPOINTS.USER);
  console.log("api.js, fetched user data", res.data);
  return res.data;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

// <-- EKLE: Getter fonksiyonlar buraya taşındı (cycle önlendi)
export const getPoints = () => apiClient.get(ENDPOINTS.POINTS);
export const getDelivery = () => apiClient.get(ENDPOINTS.DELIVERY);
export const getBatteryTypes = () => apiClient.get(ENDPOINTS.BATTER_TYPES);
export const getRewards = () => apiClient.get(ENDPOINTS.REWARDS);
export const getStaff = () => apiClient.get(ENDPOINTS.STAFF);
export const getUsers = () => apiClient.get(ENDPOINTS.USERS);
export const getUserReward = () => apiClient.get(ENDPOINTS.USER_REWARD);
export const getFeedBacks = () => apiClient.get(ENDPOINTS.FEED_BACKS);
export const getBatterySizes = () => apiClient.get(ENDPOINTS.BATTERY_SIZES);