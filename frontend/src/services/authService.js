// Login, sign up, OTP and password reset  ->  /api/auth/*
import { api, session } from './apiClient';

export const authService = {
  /** body: { emailOrPhone, password, role: 'customer' | 'restaurant_owner' }  ->  { token, expiresAt, user } */
  login: (body) => api('/api/auth/login', { method: 'POST', body }),

  /** body: { fullName, emailOrPhone, password }  ->  { message, sentTo, devOtp } */
  signupCustomer: (body) => api('/api/auth/signup/customer', { method: 'POST', body }),

  /** body: { restaurantName, areaId, address, emailOrPhone, password } */
  signupRestaurant: (body) => api('/api/auth/signup/restaurant', { method: 'POST', body }),

  /** body: { emailOrPhone, code }  ->  { token, expiresAt, user }  (the user is logged in) */
  verifyOtp: (body) => api('/api/auth/verify-otp', { method: 'POST', body }),
  resendOtp: (emailOrPhone) => api('/api/auth/resend-otp', { method: 'POST', body: { emailOrPhone } }),

  forgotPassword: (emailOrPhone) => api('/api/auth/forgot-password', { method: 'POST', body: { emailOrPhone } }),
  resetPassword: (body) => api('/api/auth/reset-password', { method: 'POST', body }),   // { emailOrPhone, code, newPassword }

  /** Who am I? Used when the app starts to check the saved token is still valid. */
  me: () => api('/api/auth/me'),

  saveSession: (auth) => session.save(auth),
  getSavedUser: () => (session.token() ? session.user() : null),
  clearSession: () => session.clear(),
};
