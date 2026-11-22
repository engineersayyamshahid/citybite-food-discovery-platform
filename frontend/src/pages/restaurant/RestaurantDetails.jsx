import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import SmartImage from '../../components/common/SmartImage';
import FormField from '../../components/forms/FormField';
import Chip from '../../components/common/Chip';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { img } from '../../services/apiClient';
import { compressImageFile } from '../../utils/helpers';
import { validateName } from '../../utils/validators';

/**
 * Edit what customers see: cover, logo, name, cuisines, description, address, area.
 *  GET/PUT /api/my-restaurant, photos: POST /api/my-restaurant/cover and /logo
 */
export default function RestaurantDetails() {
  const { cuisines, areas, setMyRestaurant } = useApp();
  const navigate = useNavigate();
  const coverIn = useRef(null);
  const logoIn = useRef(null);
  const { data: r, error, reload } = useAsync(() => myRestaurantService.get(), []);
  const [form, setForm] = useState(null);
  const [cover, setCover] = useState({ file: null, preview: null });
  const [logo, setLogo] = useState({ file: null, preview: null });
  const [error1, setError1] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!r) return;
    setForm({ name: r.name, description: r.description || '', address: r.address, areaId: r.areaId, cuisineIds: r.cuisineIds });
    setCover({ file: null, preview: img(r.coverPhotoUrl) });
    setLogo({ file: null, preview: img(r.logoUrl) });
  }, [r]);

  if (error) return <div className="page narrow-page"><ErrorState error={error} onRetry={reload} /></div>;
  if (!form) return <div className="page narrow-page"><Skeleton h={170} r={20} /><div style={{ height: 14 }} /><Skeleton h={52} r={14} /></div>;

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError1(''); };
  const pick = (setter) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const small = await compressImageFile(file, 1280);
      setter({ file: small, preview: URL.createObjectURL(small) });
    } catch (err) { toast.error(err.message); }
  };
  const toggle = (id) => set('cuisineIds', form.cuisineIds.includes(id) ? form.cuisineIds.filter((x) => x !== id) : [...form.cuisineIds, id]);

  const save = async () => {
    const err = validateName(form.name, 'restaurant name') || (form.address.trim().length < 3 ? 'Enter your address' : '') || (form.cuisineIds.length === 0 ? 'Choose at least one cuisine' : '');
    if (err) return setError1(err);
    setSaving(true);
    try {
      await myRestaurantService.update({ name: form.name.trim(), description: form.description.trim() || null, address: form.address.trim(), areaId: Number(form.areaId), cuisineIds: form.cuisineIds });
      if (cover.file) await myRestaurantService.uploadCover(cover.file);
      if (logo.file) await myRestaurantService.uploadLogo(logo.file);
      setMyRestaurant(await myRestaurantService.get());
      toast.success('Restaurant details saved');
      navigate('/r/settings');
    } catch (e2) {
      setError1(e2.message);
      setSaving(false);
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader title="Restaurant details" fallback="/r/settings" />
      <div className="cover-edit">
        <SmartImage src={cover.preview} alt="Cover" className="cover-edit-img" label={form.name} />
        <input ref={coverIn} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick(setCover)} />
        <button type="button" className="glass-btn" onClick={() => coverIn.current?.click()}><Camera size={14} /> Change cover</button>
      </div>
      <div className="row gap-sm">
        <div className="logo-edit">{logo.preview ? <img src={logo.preview} alt="Logo" /> : <span>{(form.name || 'R').slice(0, 2).toUpperCase()}</span>}</div>
        <input ref={logoIn} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick(setLogo)} />
        <button type="button" className="link-orange bold" onClick={() => logoIn.current?.click()}>Change logo</button>
      </div>
      <div className="stack">
        <FormField label="Restaurant name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} />
        <div className="field">
          <label>Cuisines (customers filter by these)</label>
          <div className="chips-wrap">{cuisines.map((c) => <Chip key={c.cuisineId} on={form.cuisineIds.includes(c.cuisineId)} onClick={() => toggle(c.cuisineId)}>{c.name}</Chip>)}</div>
        </div>
        <FormField textarea rows={3} label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={500} placeholder="Tell customers what makes you special" />
        <FormField label="Area" value={form.areaId} onChange={(e) => set('areaId', e.target.value)} options={areas.map((a) => ({ value: a.areaId, label: `${a.name}, ${a.city}` }))} />
        <FormField label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Shop, street" maxLength={255} />
        {error1 && <p className="form-alert" role="alert">{error1}</p>}
      </div>
      <div className="sticky-foot"><Button block loading={saving} onClick={save}>Save details</Button></div>
    </div>
  );
}
