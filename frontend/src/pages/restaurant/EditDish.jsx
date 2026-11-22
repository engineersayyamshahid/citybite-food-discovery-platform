import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import PhotoPicker from '../../components/forms/PhotoPicker';
import FormField from '../../components/forms/FormField';
import Chip from '../../components/common/Chip';
import Toggle from '../../components/common/Toggle';
import Sheet from '../../components/common/Sheet';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { img } from '../../services/apiClient';
import { validatePrice, validateName, hasErrors } from '../../utils/validators';

/**
 * Add a new dish (POST /api/my-restaurant/dishes) or edit one (PUT .../dishes/:id).
 * Photo: POST .../dishes/:id/photo (after the dish is saved). Sizes are sent inside the dish.
 */
export default function EditDish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cuisines } = useApp();
  const dish = useAsync(() => myRestaurantService.dish(id), [id], { enabled: !!id });
  const cats = useAsync(() => myRestaurantService.categories(), []);

  const [form, setForm] = useState({ name: '', categoryId: null, foodTypeId: '', price: '', description: '', isAvailable: true });
  const [photo, setPhoto] = useState({ file: null, preview: null });
  const [sizes, setSizes] = useState([]);                 // [{ sizeId?, label, price }]
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [sizeSheet, setSizeSheet] = useState(false);
  const [sizeDraft, setSizeDraft] = useState([]);
  const [newCat, setNewCat] = useState(null);             // null = hidden, string = typing a new category
  const [confirmDelete, setConfirmDelete] = useState(false);

  // fill the form when an existing dish arrives
  useEffect(() => {
    const d = dish.data;
    if (!d) return;
    setForm({ name: d.name, categoryId: d.categoryId, foodTypeId: d.foodTypeId ?? '', price: d.sizes.length ? '' : String(d.price), description: d.description || '', isAvailable: d.isAvailable });
    setPhoto({ file: null, preview: img(d.photoUrl) });
    setSizes(d.sizes.map((s) => ({ sizeId: s.sizeId, label: s.label, price: String(s.price) })));
  }, [dish.data]);

  if (id && dish.error) return <div className="page narrow-page"><ErrorState error={dish.error} onRetry={dish.reload} /></div>;
  if (id && !dish.data) return <div className="page narrow-page"><Skeleton h={150} r={20} /><div style={{ height: 14 }} /><Skeleton h={52} r={14} /></div>;
  const existing = dish.data;

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };

  const addCategory = async () => {
    const name = (newCat || '').trim();
    setNewCat(null);
    if (!name) return;
    try {
      const c = await myRestaurantService.addCategory(name);
      cats.reload();
      set('categoryId', c.categoryId);
    } catch (err) { toast.error(err.message); }
  };

  const openSizes = () => { setSizeDraft(sizes.length ? sizes : [{ label: '', price: '' }]); setSizeSheet(true); };
  const saveSizes = () => {
    const clean = sizeDraft.filter((s) => s.label.trim() || s.price);
    if (clean.some((s) => !s.label.trim() || validatePrice(s.price))) return toast.error('Every size needs a name and a price');
    setSizes(clean);
    setSizeSheet(false);
  };

  const hasSizes = sizes.length > 0;
  const lowestSize = hasSizes ? Math.min(...sizes.map((s) => Number(s.price))) : 0;   // the backend also uses the lowest size as the dish price

  const save = async () => {
    const errs = { name: validateName(form.name, 'dish name'), price: hasSizes ? '' : validatePrice(form.price) };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    const body = {
      name: form.name.trim(), categoryId: form.categoryId, foodTypeId: form.foodTypeId ? Number(form.foodTypeId) : null,
      basePrice: hasSizes ? null : Number(form.price), description: form.description.trim() || null, isAvailable: form.isAvailable,
      sizes: sizes.map((s) => ({ sizeId: s.sizeId ?? null, label: s.label.trim(), price: Number(s.price) })),
    };
    try {
      const saved = existing ? await myRestaurantService.editDish(existing.dishId, body) : await myRestaurantService.addDish(body);
      if (photo.file) {
        try { await myRestaurantService.uploadDishPhoto(saved.dishId, photo.file); } catch (e) { toast.error(`Dish saved, but the photo failed: ${e.message}`); }
      }
      toast.success(existing ? 'Dish updated' : 'Dish added to your menu');
      navigate('/r/menu', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await myRestaurantService.deleteDish(existing.dishId);
      toast.success('Dish deleted');
      navigate('/r/menu', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setConfirmDelete(false);
    }
  };

  const foodTypeOptions = [{ value: '', label: 'Not set' }, ...cuisines.flatMap((c) => c.foodTypes.map((t) => ({ value: t.foodTypeId, label: `${c.name} · ${t.name}` })))];

  return (
    <div className="page narrow-page">
      <PageHeader title={existing ? 'Edit dish' : 'Add dish'} fallback="/r/menu" />
      <div className="stack">
        <PhotoPicker variant="wide" value={photo.preview} onChange={(file, preview) => setPhoto({ file, preview })} label="Add photo" />
        <FormField label="Dish name" placeholder="e.g. Chicken Karahi" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} />
        <div className="field">
          <label>Category</label>
          <div className="chips-wrap">
            {(cats.data || []).map((c) => <Chip key={c.categoryId} on={form.categoryId === c.categoryId} onClick={() => set('categoryId', c.categoryId)}>{c.name}</Chip>)}
            {newCat === null ? <Chip icon={Plus} onClick={() => setNewCat('')}>New</Chip> : (
              <span className="new-cat">
                <input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} placeholder="Category name" aria-label="New category" maxLength={60} />
                <button type="button" className="link-orange small" onClick={addCategory}>Add</button>
              </span>
            )}
          </div>
        </div>
        <FormField label="Food type (used for rankings)" value={form.foodTypeId} onChange={(e) => set('foodTypeId', e.target.value)} options={foodTypeOptions} hint='Pick the closest type, e.g. "Chicken Karahi", so the dish can be ranked.' />
        <FormField label="Price (Rs.)" inputMode="numeric" placeholder="850" value={hasSizes ? String(lowestSize) : form.price} disabled={hasSizes} onChange={(e) => set('price', e.target.value.replace(/[^\d.]/g, ''))} error={errors.price} hint={hasSizes ? 'Price comes from your sizes (the lowest one)' : undefined} />
        <FormField textarea rows={3} label="Description (optional)" placeholder="Short description of the dish" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />

        <button type="button" className="link-card card" onClick={openSizes}>
          <div className="left"><b>Sizes</b><p className="muted small">{hasSizes ? sizes.map((s) => s.label).join(' / ') : 'Half / Full, Small / Medium / Large'}</p></div>
          <ChevronRight size={20} className="muted" />
        </button>
        <div className="row between"><b>Available on menu</b><Toggle checked={form.isAvailable} onChange={(v) => set('isAvailable', v)} label="Available on menu" /></div>
      </div>

      <div className="sticky-foot">
        <Button block onClick={save} loading={saving}>Save dish</Button>
        {existing && <button type="button" className="link-red" onClick={() => setConfirmDelete(true)}>Delete dish</button>}
      </div>

      <Sheet open={sizeSheet} onClose={() => setSizeSheet(false)} title="Sizes" subtitle="Customers pick these on the dish page. Leave sizes empty if the dish has one price." footer={<Button block onClick={saveSizes}>Save sizes</Button>}>
        <p className="eyebrow">Sizes (price in Rs.)</p>
        <div className="stack-sm">
          {sizeDraft.map((s, i) => (
            <div className="size-edit" key={s.sizeId ?? `n${i}`}>
              <input className="input" placeholder="e.g. Half (serves 1)" aria-label="Size name" value={s.label} onChange={(e) => setSizeDraft((d) => d.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} maxLength={40} />
              <input className="input price-in" inputMode="numeric" placeholder="500" aria-label="Size price" value={s.price} onChange={(e) => setSizeDraft((d) => d.map((x, k) => (k === i ? { ...x, price: e.target.value.replace(/[^\d]/g, '') } : x)))} />
              <button type="button" className="icon-plain" onClick={() => setSizeDraft((d) => d.filter((_, k) => k !== i))} aria-label="Remove size"><X size={18} /></button>
            </div>
          ))}
        </div>
        <button type="button" className="link-orange bold" style={{ marginTop: 12 }} onClick={() => setSizeDraft((d) => [...d, { label: '', price: '' }])}>+ Add size</button>
      </Sheet>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this dish?" danger confirmText="Delete" message={`"${existing?.name}" will be removed from your menu.`} onConfirm={remove} />
    </div>
  );
}
