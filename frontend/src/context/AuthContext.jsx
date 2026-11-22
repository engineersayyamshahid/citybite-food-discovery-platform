import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

/**
 * Keeps track of who is logged in (token + user from the backend).
 * Wrap the app with this once (see main.jsx). Components read it with useAuth().
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSavedUser());
  // sign up (or "verify your number") waits here until the OTP is entered
  const [pending, setPending] = useState(null); // { identifier, role, devOtp }

  // on app start: ask the backend if the saved token still works (a 401 logs the user out automatically)
  useEffect(() => {
    if (!authService.getSavedUser()) return;
    authService.me().then((u) => setUser(u)).catch(() => {});
  }, []);

  // the token was rejected somewhere in the app -> show the login page
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('cb:session-expired', onExpired);
    return () => window.removeEventListener('cb:session-expired', onExpired);
  }, []);

  const startSession = useCallback((auth) => {
    authService.saveSession(auth);
    setUser(auth.user);
    return auth.user;
  }, []);

  const login = useCallback(async ({ identifier, password, role }) => {
    const auth = await authService.login({ emailOrPhone: identifier, password, role });
    return startSession(auth);
  }, [startSession]);

  const signup = useCallback(async (data) => {
    const sent = data.role === 'restaurant_owner'
      ? await authService.signupRestaurant({ restaurantName: data.name, areaId: Number(data.areaId), address: data.address, emailOrPhone: data.identifier, password: data.password })
      : await authService.signupCustomer({ fullName: data.name, emailOrPhone: data.identifier, password: data.password });
    setPending({ identifier: data.identifier, role: data.role, devOtp: sent.devOtp, sentTo: sent.sentTo });
    return sent;
  }, []);

  // login said "please verify first" -> send a new code and show the OTP screen
  const startVerification = useCallback(async (identifier, role) => {
    const sent = await authService.resendOtp(identifier);
    setPending({ identifier, role, devOtp: sent.devOtp, sentTo: sent.sentTo });
  }, []);

  const verifyOtp = useCallback(async (code) => {
    const auth = await authService.verifyOtp({ emailOrPhone: pending.identifier, code });
    setPending(null);
    return startSession(auth);
  }, [pending, startSession]);

  const resendOtp = useCallback(async () => {
    const sent = await authService.resendOtp(pending.identifier);
    setPending((p) => ({ ...p, devOtp: sent.devOtp }));
    return sent;
  }, [pending]);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, signup, pending, verifyOtp, resendOtp, startVerification }),
    [user, login, logout, signup, pending, verifyOtp, resendOtp, startVerification]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
