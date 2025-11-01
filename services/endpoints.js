// services/endpoints.js
// Sadece URL sabitleri – fonksiyonlar api.js'e taşındı (cycle önlendi)

// export const API_BASE_URL = "http://192.168.7.205:8000/api";  // IP'ni güncelle
export const API_BASE_URL = "http://10.203.77.148:8000/api";  // IP'ni güncelle

export const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register/",
  LOGIN: "/auth/token/",
  REFRESH: "/auth/token/refresh/",
  LOGOUT: "/auth/logout/",
  USER: "/auth/user/",
};

// Diğer endpoint'ler sabit olarak (fonksiyonlar api.js'te)
export const ENDPOINTS = {
  POINTS: "/actions/pil-teslim-noktalari/",
  DELIVERY: "/actions/pil-teslimleri/",
  BATTER_TYPES: "/pil-tipleri",
  REWARDS: "/actions/rewards/",
  STAFF: "/staff/",
  USERS: "/users/",
  USER_REWARD: "/actions/user-rewards/",
  FEED_BACKS: "/feedbakcs/",  // Typo: 'feedbacks' olmalı, ama mevcut tut
  BATTERY_SIZES: "/battery-size",
};