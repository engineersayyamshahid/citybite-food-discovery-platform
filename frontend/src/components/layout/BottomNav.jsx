import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Heart, Star, User, Receipt, Menu as MenuIcon } from 'lucide-react';

// tabs for each kind of account (matches the mockups)
export const CUSTOMER_TABS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/profile', label: 'Profile', icon: User },
];
export const RESTAURANT_TABS = [
  { to: '/r/bill', label: 'Bill', icon: Receipt },
  { to: '/r/menu', label: 'Menu', icon: MenuIcon },
  { to: '/r/reviews', label: 'Reviews', icon: Star },
  { to: '/r/profile', label: 'Profile', icon: User },
];

/** Bottom tab bar - only visible on phones and small tablets */
export default function BottomNav({ tabs }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}>
          {({ isActive }) => (
            <>
              <motion.span animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                <Icon size={22} />
              </motion.span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
