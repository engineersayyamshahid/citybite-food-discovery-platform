import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SmartImage from '../../components/common/SmartImage';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { currentPromotion, promoRange } from '../../services/promotionService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';

/**
 * Status of the running promotion (GET /api/my-restaurant/promotions):
 * progress, stats (views / taps / saves counted by the backend), stop (POST .../stop) or extend (POST .../extend).
 */
export default function Promotion() {
  const { myRestaurant: r } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => myRestaurantService.promotions(), []);
  const [dialog, setDialog] = useState(null); // 'stop' | 'extend'
  const [busy, setBusy] = useState(false);

  if (error) return <div className="page narrow-page"><ErrorState error={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="page narrow-page"><Skeleton h={140} r={20} /></div>;
  const p = currentPromotion(data);
  if (!p) return <Navigate to="/r/promote" replace />;

  const queued = data.filter((x) => x.status === 'scheduled' && x.packageId === p.packageId);
  const day = p.dayNumber ?? 0;

  const stop = async () => {
    setBusy(true);
    try {
      await myRestaurantService.stopPromotion(p.promotionId);
      toast('Promotion stopped');
      navigate('/r/settings', { replace: true });
    } catch (err) { toast.error(err.message); setBusy(false); setDialog(null); }
  };
  const extend = async () => {
    setBusy(true);
    try {
      await myRestaurantService.extendPromotion(p.promotionId, 7);
      toast.success('Promotion extended by 7 days (starts when this one ends)');
      setDialog(null);
      reload();
    } catch (err) { toast.error(err.message); setDialog(null); }
    setBusy(false);
  };

  return (
    <div className="page narrow-page">
      <PageHeader title="Your promotion" fallback="/r/settings" />
      <div className="promo-card">
        <div className="row between"><h2>{p.packageName}</h2><span className="active-pill">{p.status === 'active' ? 'Active' : 'Scheduled'}</span></div>
        <p>{promoRange(p)} · {p.durationDays} days · Paid {formatPrice(p.amountPaid)}</p>
        <div className="progress"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (day / p.durationDays) * 100)}%` }} transition={{ duration: 0.8 }} /></div>
        <p className="small">{p.status === 'active' ? `Day ${day} of ${p.durationDays}` : 'Starts soon'}</p>
      </div>
      <div className="stats3">
        <div className="stat-box"><span>Views</span><b>{p.views.toLocaleString('en-US')}</b></div>
        <div className="stat-box"><span>Taps</span><b>{p.taps.toLocaleString('en-US')}</b></div>
        <div className="stat-box"><span>Saves</span><b>{p.saves.toLocaleString('en-US')}</b></div>
      </div>
      {queued.length > 0 && <p className="muted xs">{queued.length} extension{queued.length > 1 ? 's' : ''} queued after this one.</p>}
      <p className="eyebrow">How you appear</p>
      <div className="sponsored-card static">
        <SmartImage src={img(r?.coverPhotoUrl || r?.logoUrl)} alt="" className="sp-img" label={r?.name || 'R'} />
        <div className="grow"><Badge variant="sponsored">Sponsored</Badge><h3 className="sp-name">{r?.name}</h3><p className="muted small">{(r?.cuisines || []).join(' · ')} · {r?.areaName}</p></div>
      </div>

      <div className="row gap sticky-foot">
        <Button variant="outline" block className="danger-outline" onClick={() => setDialog('stop')}>Stop promotion</Button>
        <Button block onClick={() => setDialog('extend')}>Extend</Button>
      </div>

      <ConfirmDialog open={dialog === 'stop'} onClose={() => setDialog(null)} title="Stop promotion?" danger confirmText={busy ? 'Stopping…' : 'Stop'} message="Your restaurant will stop appearing as sponsored. Unused days are not refunded." onConfirm={stop} />
      <ConfirmDialog open={dialog === 'extend'} onClose={() => setDialog(null)} title="Extend by 7 days?" confirmText={busy ? 'Extending…' : 'Extend'} message="Add 7 more days. They start right after the current promotion ends. Prototype note: no real payment is taken." onConfirm={extend} />
    </div>
  );
}
