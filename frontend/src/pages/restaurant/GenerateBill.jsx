import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Search, Settings as Cog, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';
import Chip from '../../components/common/Chip';
import SmartImage from '../../components/common/SmartImage';
import Stepper from '../../components/forms/Stepper';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { billService, previewCount, previewTotal } from '../../services/billService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';

const shortSize = (label) => label.split(' (')[0];

/**
 * Restaurant screen: pick the dishes a table ate and generate a bill.
 *  GET  /api/my-restaurant/bill-menu   -> every dish with its sizes
 *  POST /api/my-restaurant/bills       -> only { dishId, sizeId, qty } are sent; the backend adds the prices and makes the review code
 */
export default function GenerateBill() {
  const { myRestaurant } = useApp();
  const navigate = useNavigate();
  const menu = useAsync(() => billService.menu(), []);
  const [table, setTable] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [qty, setQty] = useState({}); // key: "dishId|sizeId" -> number
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // one row per dish (or per size, e.g. Chicken Karahi Half / Full)
  const rows = useMemo(() => (menu.data || []).filter((d) => d.isAvailable).flatMap((d) =>
    d.sizes.length
      ? d.sizes.map((s) => ({ key: `${d.dishId}|${s.sizeId}`, dish: d, sizeId: s.sizeId, size: shortSize(s.label), sizeLabel: s.label, price: s.price }))
      : [{ key: `${d.dishId}|`, dish: d, sizeId: null, size: '', sizeLabel: '', price: d.price }]
  ), [menu.data]);

  const cats = useMemo(() => ['All', ...new Set(rows.map((r) => r.dish.category).filter(Boolean))], [rows]);
  const shown = rows.filter((r) => (cat === 'All' || r.dish.category === cat) && r.dish.name.toLowerCase().includes(q.toLowerCase()));

  const lines = rows.filter((r) => qty[r.key] > 0).map((r) => ({ ...r, qty: qty[r.key] }));
  const setRow = (key, n) => { setQty((p) => ({ ...p, [key]: Math.max(0, Math.min(99, n)) })); setError(''); };

  const generate = async () => {
    const t = Number(table);
    if (!table.trim() || !Number.isInteger(t) || t < 1 || t > 999) return setError('Enter the table number (1 to 999)');
    if (!lines.length) return setError('Add at least one dish');
    setSaving(true);
    try {
      const bill = await billService.create(t, lines.map((l) => ({ dishId: l.dish.dishId, sizeId: l.sizeId, qty: l.qty })));
      navigate(`/r/bill/${bill.billId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="page bill-page">
      <div className="row between">
        <div><p className="muted small">{myRestaurant?.name || ' '}</p><h1 className="h-serif">Generate bill</h1></div>
        <div className="row gap-sm">
          <Link to="/r/bills" className="icon-btn" aria-label="Bill history"><History size={20} /></Link>
          <Link to="/r/settings" className="icon-btn" aria-label="Restaurant settings"><Cog size={20} /></Link>
        </div>
      </div>

      <div className="two-fields">
        <div className="field"><label htmlFor="table">Table</label><input id="table" className="input center" inputMode="numeric" value={table} onChange={(e) => { setTable(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="e.g. 3" maxLength={3} /></div>
        <div className="field grow"><label htmlFor="menuq">Add from menu</label>
          <div className="searchbar"><Search size={18} className="searchbar-icon" /><input id="menuq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your menu" /></div>
        </div>
      </div>

      <div className="chips-scroll">{cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>

      {menu.loading ? <ListSkeleton count={4} /> : menu.error ? <ErrorState error={menu.error} onRetry={menu.reload} /> : rows.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Your menu is empty" text="Add dishes to your menu first (and make sure they are marked Available), then you can create bills." action={<Link to="/r/menu/new" className="btn btn-primary">Add a dish</Link>} />
      ) : (
        <div className="bill-rows">
          {shown.map((r) => {
            const n = qty[r.key] || 0;
            return (
              <motion.div layout key={r.key} className={`bill-row ${n ? 'on' : ''}`}>
                <SmartImage src={img(r.dish.photoUrl)} alt="" className="rest-thumb" />
                <div className="grow"><b>{r.dish.name}</b><p className="muted small">{r.size ? `${r.size} · ` : ''}{formatPrice(r.price)}</p></div>
                {n ? <Stepper value={n} onChange={(v) => setRow(r.key, v)} /> : <Button variant="outline" size="sm" onClick={() => setRow(r.key, 1)}>Add</Button>}
              </motion.div>
            );
          })}
          {shown.length === 0 && <p className="muted center">No dish matches your search.</p>}
        </div>
      )}

      <div className="bill-bar">
        <div className="row between"><span className="muted small">{lines.length} dishes · {previewCount(lines)} items{table ? ` · Table ${table}` : ''}</span><b className="price big">{formatPrice(previewTotal(lines))}</b></div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <Button block onClick={generate} disabled={!lines.length} loading={saving}>Generate bill</Button>
      </div>
    </div>
  );
}
