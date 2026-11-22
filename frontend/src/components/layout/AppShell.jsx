import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNav, { CUSTOMER_TABS, RESTAURANT_TABS } from './BottomNav';
import TopBar from './TopBar';
import Footer from './Footer';

/**
 * Frame for every logged-in screen:
 *  - phones: content + bottom tab bar
 *  - desktop: top navbar + wide content + footer
 * `hideTabs` lets inner screens (like "Add review") hide the bottom bar.
 */
export default function AppShell({ role }) {
  const location = useLocation();
  const tabs = role === 'restaurant_owner' ? RESTAURANT_TABS : CUSTOMER_TABS;

  // tabs are hidden on "deep" screens, same as in the mockups
  const topLevel = tabs.some((t) => location.pathname === t.to);
  const hideBottom = !topLevel;

  return (
    <div className={`shell ${hideBottom ? 'no-tabs' : ''}`}>
      <TopBar tabs={tabs} />
      <main className="shell-main" id="main">
        {/* small fade + slide every time the page changes */}
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      {!hideBottom && <BottomNav tabs={tabs} />}
    </div>
  );
}
