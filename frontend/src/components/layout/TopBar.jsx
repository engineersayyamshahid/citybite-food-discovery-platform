import { NavLink, Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Logo from '../common/Logo';
import useAuth from '../../hooks/useAuth';
import useApp from '../../hooks/useApp';
import { ROLES, homeFor } from '../../utils/constants';
import { initials } from '../../utils/helpers';

/**
 * Website navigation bar - shown on laptops and desktops (>= 900px).
 * On phones the bottom tab bar is used instead.
 */
export default function TopBar({ tabs }) {
  const { user } = useAuth();
  const { area } = useApp();
  const profilePath = user?.role === ROLES.owner ? '/r/profile' : '/profile';

  return (
    <header className="topbar">
      <div className="topbar-in">
        <Logo to={user ? homeFor(user) : '/'} />
        <nav className="topbar-nav" aria-label="Main">
          {tabs.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `top-link ${isActive ? 'on' : ''}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          {user?.role === ROLES.customer && (
            <Link to="/onboarding/area" className="area-pill"><MapPin size={16} /> {area?.name || 'Choose area'}</Link>
          )}
          {user ? (
            <Link to={profilePath} className="avatar-sm" aria-label="Profile">{initials(user.fullName)}</Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
