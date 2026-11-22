import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Segmented from '../../components/common/Segmented';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SmartImage from '../../components/common/SmartImage';
import ErrorState from '../../components/common/ErrorState';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { browseService } from '../../services/browseService';
import { myRestaurantService } from '../../services/myRestaurantService';
import { currentPromotion } from '../../services/promotionService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';

/**
 * Choose a package and duration to promote the restaurant.
 *  GET /api/promotion-packages (prices for 7/14/30 days), POST /api/my-restaurant/promotions.
 *  Nothing is really charged - the backend only records the promotion.
 */
export default function Promote() {
  const { myRestaurant: r } = useApp();
  const navigate = useNavigate();
  const packages = useAsync(() => browseService.packages(), []);
  const promos = useAsync(() => myRestaurantService.promotions(), []);
  const [pkgId, setPkgId] = useState(null);
  const [days, setDays] = useState(7);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  if (packages.error) return <div className="page narrow-page"><ErrorState error={packages.error} onRetry={packages.reload} /></div>;
  if (!packages.data) return <div className="page narrow-page"><ListSkeleton count={3} /></div>;

  const list = packages.data;
  const pkg = list.find((p) => p.packageId === (pkgId ?? list[0]?.packageId));
  const price = pkg?.durations.find((d) => d.days === days)?.price ?? 0;
  const running = currentPromotion(promos.data || []);

  const pay = async () => {
    setSaving(true);
    try {
      await myRestaurantService.startPromotion(pkg.packageId, days);
      toast.success('Promotion is live!');
      navigate('/r/promotion', { replace: true });
    } catch (err) {
      toast.error(err.message);       // e.g. "You already have ... running. Use Extend"
      setConfirm(false);
      setSaving(false);
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader title="Promote my restaurant" fallback="/r/settings" />
      <p className="muted">New on CityBite? Pay to appear in front of customers who have not found you yet.</p>
      {running && <div className="notice orange-note"><div><b>You already have a promotion</b><p className="small">{running.packageName} is {running.status}.</p></div><Link to="/r/promotion" className="btn btn-outline btn-sm">View</Link></div>}

      <p className="eyebrow">How customers will see you</p>
      <div className="sponsored-card static">
        <SmartImage src={img(r?.coverPhotoUrl || r?.logoUrl)} alt="" className="sp-img" label={r?.name || 'R'} />
        <div className="grow"><Badge variant="sponsored">Sponsored</Badge><h3 className="sp-name">{r?.name}</h3><p className="muted small">{(r?.cuisines || []).join(' · ') || 'Your cuisines'} · {r?.areaName}</p></div>
      </div>

      <p className="eyebrow">Choose a package</p>
      <div className="stack-sm" role="radiogroup" aria-label="Package">
        {list.map((p) => (
          <button key={p.packageId} type="button" role="radio" aria-checked={pkg.packageId === p.packageId} className={`radio-card ${pkg.packageId === p.packageId ? 'on' : ''}`} onClick={() => setPkgId(p.packageId)}>
            <span className="radio-dot" />
            <span className="left grow"><b>{p.name}</b><span className="muted small block">{p.description}</span></span>
            <b>{formatPrice(p.durations.find((d) => d.days === days)?.price ?? p.price)}</b>
          </button>
        ))}
      </div>

      <p className="eyebrow">Duration</p>
      <Segmented options={pkg.durations.map((d) => ({ value: d.days, label: `${d.days} days` }))} value={days} onChange={setDays} />

      <div className="sticky-foot"><Button block onClick={() => setConfirm(true)}>Pay {formatPrice(price)} &amp; promote</Button></div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Confirm promotion" confirmText={saving ? 'Starting…' : 'Start promotion'} onConfirm={pay}
        message={`${pkg.name} for ${days} days - ${formatPrice(price)}. Prototype note: no real payment is taken, the promotion is only recorded.`} />
    </div>
  );
}
