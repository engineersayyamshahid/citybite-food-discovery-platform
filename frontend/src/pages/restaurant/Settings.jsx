import { Link } from 'react-router-dom';
import { ChevronRight, Clock, ImageIcon, Megaphone } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { currentPromotion } from '../../services/promotionService';

/** Settings menu: details, opening hours (summary from GET .../opening-hours), promotion (GET .../promotions) */
export default function Settings() {
  const { myRestaurant } = useApp();
  const hours = useAsync(() => myRestaurantService.hours(), []);
  const promos = useAsync(() => myRestaurantService.promotions(), []);

  const open = (hours.data || []).filter((h) => !h.isClosed);
  const summary = hours.data ? (open.length ? `${open[0].day} – ${open[open.length - 1].day} · ${open[0].openTime} – ${open[0].closeTime}` : 'Closed all week') : 'Loading…';
  const active = currentPromotion(promos.data || []);

  const rows = [
    { to: '/r/settings/details', icon: ImageIcon, title: 'Restaurant details', text: 'Photo, cuisines, description, address' },
    { to: '/r/settings/hours', icon: Clock, title: 'Opening hours', text: summary },
    { to: active ? '/r/promotion' : '/r/promote', icon: Megaphone, title: 'Promote my restaurant', text: active ? 'Promotion is active' : 'Paid ads to reach new customers' },
  ];

  return (
    <div className="page narrow-page">
      <PageHeader title="Restaurant settings" fallback="/r/profile" />
      <p className="muted">Everything customers see about {myRestaurant?.name || 'your restaurant'} is set here.</p>
      <div className="card settings-list">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="setting-row">
            <span className="loc-ic"><r.icon size={20} /></span>
            <div className="left grow"><b>{r.title}</b><p className="muted small">{r.text}</p></div>
            <ChevronRight size={20} className="muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
