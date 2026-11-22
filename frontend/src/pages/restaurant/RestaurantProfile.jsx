import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import SmartImage from '../../components/common/SmartImage';
import useApp from '../../hooks/useApp';
import useAuth from '../../hooks/useAuth';
import { img } from '../../services/apiClient';

/** Restaurant owner's profile (data from GET /api/my-restaurant) with a link to settings and logout. */
export default function RestaurantProfile() {
  const { logout } = useAuth();
  const { myRestaurant: r } = useApp();
  const navigate = useNavigate();

  return (
    <div className="page narrow-page profile">
      <h1 className="h-serif">Profile</h1>
      <div className="avatar-lg sq"><SmartImage src={img(r?.logoUrl || r?.coverPhotoUrl)} alt="" label={r?.name || 'R'} /></div>
      <dl className="info-list">
        <div><dt>Restaurant name</dt><dd>{r?.name || '…'}</dd></div>
        <div><dt>Email</dt><dd>{r?.ownerEmail || '—'}</dd></div>
        <div><dt>Mobile number</dt><dd>{r?.ownerMobile || '—'}</dd></div>
      </dl>
      <Link to="/r/settings" className="link-card card">
        <span className="loc-ic"><Settings size={20} /></span>
        <div className="left grow"><b>Restaurant settings</b><p className="muted small">Details, hours, promotion</p></div>
        <ChevronRight size={20} className="muted" />
      </Link>
      <div className="stack profile-foot">
        <button type="button" className="link-red" onClick={() => { logout(); toast('Logged out'); navigate('/', { replace: true }); }}>Log out</button>
      </div>
    </div>
  );
}
