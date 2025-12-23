// services/endpoints.js
// Sadece URL sabitleri – fonksiyonlar api.js'e taşındı (cycle önlendi)

// export const API_BASE_URL = "http://192.168.7.205:8000/api";  // IP'ni güncelle
export const API_BASE_URL = "http://192.168.217.205:8000";  // IP'ni güncelle

export const AUTH_ENDPOINTS = {
  REGISTER: "/api/auth/register/",
  LOGIN: "/api/auth/token/",
  REFRESH: "/api/auth/token/refresh/",
  LOGOUT: "/api/auth/logout/",
  USER: "/api/auth/user/",
};

export const ENDPOINTS = {
  POINTS: "/api/actions/pil-teslim-noktalari/",
  DELIVERY: "/api/actions/pil-teslimleri/",
  BATTER_TYPES: "/api/pil-tipleri/",
  REWARDS: "/api/actions/rewards/",
  STAFF: "/api/staff/",
  USERS: "/api/users/",
  USER_REWARD: "/api/actions/user-rewards/",
  FEED_BACKS: "/api/feedbacks/",  // Typo düzelt
  BATTERY_SIZES: "/api/battery-sizes/",
  AI_ANALYSIS: "/api/ai/text-extraction/",
  AI_BATTERY_DETECTION: "/api/ai/battery-detection/",  // Düzelt
};