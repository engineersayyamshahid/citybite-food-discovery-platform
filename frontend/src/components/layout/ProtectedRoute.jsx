import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { homeFor } from '../../utils/constants';

/**
 * Only lets the right kind of account into a section.
 * Customers (role "customer") see /home etc., restaurant owners (role "restaurant_owner") see /r/... Everyone else goes to the login page.
 */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}
