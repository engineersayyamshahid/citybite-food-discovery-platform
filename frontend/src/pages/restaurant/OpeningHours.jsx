import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import Toggle from '../../components/common/Toggle';
import Sheet from '../../components/common/Sheet';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { to12h, to24h } from '../../utils/helpers';

/**
 * Open/closed and opening times for each day (GET + PUT /api/my-restaurant/opening-hours).
 * dayOfWeek: 1 = Monday ... 7 = Sunday. Times are kept as "11:00" (24 hour) while editing.
 */
export default function OpeningHours() {
  const navigate = useNavigate();
  const { data, error, reload } = useAsync(() => myRestaurantService.hours(), []);
  const [hours, setHours] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [draft, setDraft] = useState({ open: '', close: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setHours(data.map((h) => ({ dayOfWeek: h.dayOfWeek, day: h.day, isClosed: h.isClosed, open: to24h(h.openTime) || '11:00', close: to24h(h.closeTime) || '00:00' })));
  }, [data]);

  if (error) return <div className="page narrow-page"><ErrorState error={error} onRetry={reload} /></div>;
  if (!hours) return <div className="page narrow-page"><ListSkeleton count={5} /></div>;

  const patch = (i, p) => setHours((h) => h.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const openEdit = (i) => { setDraft({ open: hours[i].open, close: hours[i].close }); setEditIdx(i); };
  const saveTimes = () => {
    if (!draft.open || !draft.close) return toast.error('Choose both times');
    if (draft.open === draft.close) return toast.error('Opening and closing time can\'t be the same');
    patch(editIdx, draft);
    setEditIdx(null);
  };
  const save = async () => {
    setSaving(true);
    try {
      await myRestaurantService.saveHours(hours.map((h) => ({ dayOfWeek: h.dayOfWeek, isClosed: h.isClosed, openTime: h.isClosed ? null : h.open, closeTime: h.isClosed ? null : h.close })));
      toast.success('Opening hours saved');
      navigate('/r/settings');
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader title="Opening hours" fallback="/r/settings" />
      <p className="muted">Customers see when you are open on your page. Tap a day to change its hours.</p>
      <div className="card hours-card">
        {hours.map((h, i) => (
          <div className="hour-row" key={h.dayOfWeek}>
            <b className="day">{h.day}</b>
            <button type="button" className="hour-time" onClick={() => openEdit(i)} disabled={h.isClosed} aria-label={`Edit ${h.day} hours`}>
              {h.isClosed ? 'Closed' : `${to12h(h.open)} – ${to12h(h.close)}`}
            </button>
            <Toggle checked={!h.isClosed} onChange={(v) => patch(i, { isClosed: !v })} label={`${h.day} open`} />
          </div>
        ))}
      </div>
      <div className="sticky-foot"><Button block loading={saving} onClick={save}>Save hours</Button></div>

      <Sheet open={editIdx !== null} onClose={() => setEditIdx(null)} title={editIdx !== null ? `${hours[editIdx].day} hours` : ''} footer={<Button block onClick={saveTimes}>Done</Button>}>
        <div className="two-fields">
          <div className="field"><label htmlFor="t-open">Opens</label><input id="t-open" type="time" className="input" value={draft.open} onChange={(e) => setDraft((d) => ({ ...d, open: e.target.value }))} /></div>
          <div className="field"><label htmlFor="t-close">Closes</label><input id="t-close" type="time" className="input" value={draft.close} onChange={(e) => setDraft((d) => ({ ...d, close: e.target.value }))} /></div>
        </div>
        <p className="muted xs">Tip: choose 12:00 AM to close at midnight.</p>
      </Sheet>
    </div>
  );
}
