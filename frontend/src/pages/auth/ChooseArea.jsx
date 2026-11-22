import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import useApp from '../../hooks/useApp';
import useAuth from '../../hooks/useAuth';
import { Skeleton } from '../../components/loaders/Skeleton';

/** "Choose your area" - search the list from GET /api/areas, saved with PUT /api/me/area. */
export default function ChooseArea() {
  const { areas, area, setArea } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const next = location.state?.next || '/home';

  const list = areas.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));

  const choose = async (a) => {
    if (!user) return toast('Log in to save your area', { icon: '🔒' });
    setBusyId(a.areaId);
    try {
      await setArea(a.areaId);
      toast.success(`Showing restaurants near ${a.name}`);
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="narrow-page">
      <header className="page-head"><BackButton fallback="/home" /><h1 className="h-serif">Choose your area</h1></header>
      <div className="searchbar">
        <Search size={18} className="searchbar-icon" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area, e.g. Model Town" aria-label="Search area" />
      </div>
      <p className="eyebrow">{q ? 'Results' : 'Areas'}</p>
      {areas.length === 0 && <div className="stack-sm">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={56} r={12} />)}</div>}
      {areas.length > 0 && list.length === 0 && <p className="muted center">No area found. Try another name.</p>}
      {list.map((a) => (
        <button key={a.areaId} type="button" className="loc-row" onClick={() => choose(a)} disabled={busyId === a.areaId}>
          <span className="loc-ic"><MapPin size={20} /></span>
          <span className="left"><b>{a.name}</b><span className="muted small block">{a.city}, Punjab</span></span>
          {area?.areaId === a.areaId && <Check size={20} className="orange" />}
        </button>
      ))}
    </div>
  );
}
