import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Shortcut so components can write: const { user, login } = useAuth();
export default function useAuth() {
  return useContext(AuthContext);
}
