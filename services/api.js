// services/api.js
import * as SecureStore from "expo-secure-store";
import apiClient from "./apiClient";
import { AUTH_ENDPOINTS, ENDPOINTS } from "./endpoints"; // endpoints'ten sabitler

export const register = async (data) => {
  // console.log("api.js, register data", data);
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
  // console.log("api.js, login data", { e_posta: email, password });
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
  return res.data;
};
export const updateUser = async (data) => {
  try {
    const res = await apiClient.patch(AUTH_ENDPOINTS.USER, data);
    if (res.status !== 200) throw new Error(`Güncelleme hatası: ${JSON.stringify(res.data)}`);
    // AuthContext'te updateUser çağır (user state güncelle)
    return res.data;
  } catch (error) {
    console.error("updateUser error:", error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = async (data) => {
  console.log("changePassword data:", data);  // Zaten var
  const res = await apiClient.post(`${AUTH_ENDPOINTS.USER}change-password/`, data);
  if (res.status !== 200) {
    // TAM PARSE: Backend errors'ı yakala (array/object)
    let errorMsg = "Şifre değiştirme hatası.";
    if (res.data) {
      if (typeof res.data === 'object') {
        // Field-specific: old_password, new_password vb.
        if (res.data.old_password && Array.isArray(res.data.old_password)) {
          errorMsg = res.data.old_password[0];  // "Eski şifre yanlış."
        } else if (res.data.new_password && Array.isArray(res.data.new_password)) {
          errorMsg = res.data.new_password[0];  // "Şifre gereksinimleri..."
        } else if (res.data.non_field_errors && Array.isArray(res.data.non_field_errors)) {
          errorMsg = res.data.non_field_errors[0];  // "Şifreler eşleşmiyor."
        } else if (res.data.detail) {
          errorMsg = res.data.detail;
        }
      } else {
        errorMsg = res.data;  // String error
      }
    }
    console.log("changePassword full error:", res.data);  // EK: Full response log (42 byte JSON'u gör)
    throw new Error(errorMsg);  // Detaylı mesaj throw
  }
  return res.data;
};

export const forgotPassword = async (data) => {  // DEĞİŞ: { e_posta, new_password, repassword } al
  const res = await apiClient.post(`${AUTH_ENDPOINTS.USER}forgot-password/`, data);
  if (res.status !== 200) throw new Error("Şifre sıfırlama hatası.");
  return res.data;
};

export const logout = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};
export const createDelivery = async (data) => {
  try {
    const res = await apiClient.post(ENDPOINTS.DELIVERY, data);
    if (res.status !== 201) {
      throw new Error(`Teslim hatası: ${JSON.stringify(res.data)}`);
    }
    return res.data;
  } catch (error) {
    console.error("createDelivery error:", error.response?.data || error.message);
    throw error;
  }
};

export const createUserReward = async (data) => {
  try {
    const res = await apiClient.post(ENDPOINTS.USER_REWARD, data);
    if (res.status !== 201) throw new Error("Sipariş oluşturulamadı.");
    return res.data;
  } catch (error) {
    console.error("createUserReward error:", error);
    throw error;
  }
};


export const analyzeBatteryImage = async (imageUri) => {
  try {
    // 1. FormData oluştur
    const formData = new FormData();
    
    // Dosya adını ve türünü belirtmek React Native'de önemlidir
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('image', {
      uri: imageUri,
      name: filename || 'photo.jpg',
      type: type,
    });

    // 2. İsteği Gönder (Content-Type header'ını override ediyoruz)
    const res = await apiClient.post(ENDPOINTS.AI_ANALYSIS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Timeout süresini biraz artıralım, OCR işlemi 2-3 saniye sürebilir
      timeout: 10000, 
    });

    if (res.status !== 200) {
      throw new Error("Analiz başarısız oldu.");
    }
    
    return res.data;
  } catch (error) {
    console.error("analyzeBatteryImage error:", error.response?.data || error.message);
    throw error;
  }
};

export const detectBattery = async (imageUri) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('image', {
      uri: imageUri,
      name: filename || 'photo.jpg',
      type,
    });

    const res = await apiClient.post(ENDPOINTS.AI_BATTERY_DETECTION, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10000,
    });

    return res.data;
  } catch (error) {
    console.error("detectBattery error:", error.response?.data || error.message);
    throw error;
  }
};
export const getPoints = () => apiClient.get(ENDPOINTS.POINTS);
export const getDelivery = () => apiClient.get(ENDPOINTS.DELIVERY);
export const getBatteryTypes = () => apiClient.get(ENDPOINTS.BATTER_TYPES);
export const getRewards = () => apiClient.get(ENDPOINTS.REWARDS);
export const getStaff = () => apiClient.get(ENDPOINTS.STAFF);
export const getUsers = () => apiClient.get(ENDPOINTS.USERS);
export const getUserReward = () => apiClient.get(ENDPOINTS.USER_REWARD);
export const getFeedBacks = () => apiClient.get(ENDPOINTS.FEED_BACKS);
export const getBatterySizes = () => apiClient.get(ENDPOINTS.BATTERY_SIZES);