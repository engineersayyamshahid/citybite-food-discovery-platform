import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SmartImage from '../../components/common/SmartImage';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { meService } from '../../services/meService';
import { CUISINE_IMAGES } from '../../data/cuisines';

/**
 * "What do you love to eat?" - pick at least 3 dish types.
 * Groups come from GET /api/cuisines (cuisine -> food types).
 * Saved with PUT /api/me/taste and used for "Top rated for you" on Home.
 */
export default function TastePicker() {
  const { cuisines } = useApp();
  const navigate = useNavigate();
  // opened from the Profile screen to change picks later
  const editing = !!useLocation().state?.editing;
  const saved = useAsync(() => meService.taste(), []);
  const [picked, setPicked] = useState(null);   // null until the saved picks arrive
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (saved.data && picked === null) setPicked(saved.data.foodTypeIds); }, [saved.data, picked]);
  useEffect(() => { if (open === null && cuisines.length) setOpen(cuisines[0].cuisineId); }, [cuisines, open]);

  const list = picked || [];
  const toggle = (id) => setPicked((p) => ((p || []).includes(id) ? p.filter((x) => x !== id) : [...(p || []), id]));
  const ready = list.length >= 3;

  const save = async () => {
    setSaving(true);
    try {
      await meService.setTaste(list);
      toast.success('Your food picks are saved');
      navigate('/home');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (saved.error) return <div className="taste"><ErrorState error={saved.error} onRetry={saved.reload} /></div>;

  return (
    <div className="taste">
      <h1 className="h-serif">What do you love to eat?</h1>
      <p className="muted">Open a food and tick the types you like. Pick at least 3. We will show the best-rated places for them on your Home screen.</p>
      <div className="stack-sm taste-list">
        {cuisines.length === 0 || picked === null ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h={64} r={20} />) : cuisines.map((g) => {
          const chosen = g.foodTypes.filter((t) => list.includes(t.foodTypeId));
          const isOpen = open === g.cuisineId;
          return (
            <div key={g.cuisineId} className={`taste-group ${chosen.length ? 'has' : ''}`}>
              <button type="button" className="taste-head" onClick={() => setOpen(isOpen ? null : g.cuisineId)} aria-expanded={isOpen}>
                <SmartImage src={CUISINE_IMAGES[g.name]} alt="" className="taste-thumb" label={g.name} />
                <div className="grow left">
                  <b>{g.name}</b>
                  <p className={`small ${chosen.length ? 'orange' : 'muted'}`}>{chosen.length ? chosen.map((t) => t.name).join(', ') : `Choose from ${g.foodTypes.length} types`}</p>
                </div>
                {chosen.length > 0 && <span className="count-dot">{chosen.length}</span>}
                <ChevronDown size={18} className={`chev ${isOpen ? 'open' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div className="taste-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
                    {g.foodTypes.map((t) => (
                      <label key={t.foodTypeId} className="check-row">
                        <input type="checkbox" checked={list.includes(t.foodTypeId)} onChange={() => toggle(t.foodTypeId)} />
                        <span className="check-box">{list.includes(t.foodTypeId) && <Check size={14} strokeWidth={3} />}</span>
                        <span className={list.includes(t.foodTypeId) ? 'bold' : ''}>{t.name}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <div className="sticky-foot">
        <div className="row between small"><span className="muted">{list.length} selected</span>{ready ? <b className="green-text">Ready to continue</b> : <span className="muted">Pick {3 - list.length} more</span>}</div>
        <Button block disabled={!ready} loading={saving} onClick={save}>{editing ? 'Save picks' : 'Continue'}</Button>
        {!editing && <button type="button" className="link-plain" onClick={() => navigate('/home')}>Skip for now</button>}
      </div>
    </div>
  );
}
