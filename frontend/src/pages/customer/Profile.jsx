import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, KeyRound, Pencil, Star, User, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import Sheet from '../../components/common/Sheet';
import FormField from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Chip from '../../components/common/Chip';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/loaders/Skeleton';
import useApp from '../../hooks/useApp';
import useAuth from '../../hooks/useAuth';
import useAsync from '../../hooks/useAsync';
import { meService } from '../../services/meService';
import { validatePassword } from '../../utils/validators';

/**
 * Customer profile.
 *  GET /api/me (info + counts), PUT /api/me (name), PUT /api/me/password,
 *  GET /api/me/favorites, GET /api/me/taste, GET /api/me/reviews (for the average rating given)
 */
export default function Profile() {
  const { logout } = useAuth();
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const me = useAsync(() => meService.profile(), []);
  const favs = useAsync(() => meService.favorites(), []);
  const taste = useAsync(() => meService.taste(), []);
  const reviews = useAsync(() => meService.myReviews(1, 50), []);

  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);

  // average of the ratings this person gave (from their latest 50 reviews)
  const avgGiven = useMemo(() => {
    const list = reviews.data?.items || [];
    return list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '—';
  }, [reviews.data]);

  if (me.error) return <div className="page narrow-page"><ErrorState error={me.error} onRetry={me.reload} /></div>;
  if (!me.data) return <div className="page narrow-page profile"><Skeleton h={120} w={120} r={60} style={{ margin: '22px auto' }} /><Skeleton h={160} r={12} /></div>;
  const p = me.data;

  const saveName = async () => {
    if (name.trim().length < 2) return setNameError('Enter your name');
    setSaving(true);
    try {
      const updated = await meService.updateProfile(name.trim());
      me.setData(updated);
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      setNameError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    const err = !pw.currentPassword ? 'Enter your current password' : validatePassword(pw.newPassword);
    setPwError(err);
    if (err) return;
    setSaving(true);
    try {
      await meService.changePassword(pw);
      setPwOpen(false);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (e2) {
      setPwError(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const doLogout = () => { logout(); toast('Logged out'); navigate('/', { replace: true }); };
  const favDishes = favs.data?.dishes || [];
  const favRests = favs.data?.restaurants || [];

  return (
    <div className="page narrow-page profile">
      <h1 className="h-serif">Profile</h1>
      <div className="avatar-lg"><User size={44} /></div>

      <dl className="info-list">
        <div><dt>Name</dt><dd>{p.fullName}</dd></div>
        <div><dt>Email</dt><dd>{p.email || '—'}</dd></div>
        <div><dt>Mobile number</dt><dd>{p.mobile || '—'}</dd></div>
      </dl>
      <div className="stack-sm">
        <Button variant="outline" block icon={Pencil} onClick={() => { setName(p.fullName); setNameError(''); setEditing(true); }}>Edit profile</Button>
        <Button variant="ghost" block icon={KeyRound} onClick={() => { setPwError(''); setPwOpen(true); }}>Change password</Button>
      </div>

      <section className="stats">
        <div className="stat"><Star size={18} /><b>{p.reviewCount}</b><span>Reviews</span></div>
        <div className="stat"><Star size={18} /><b>{avgGiven}</b><span>Avg. rating given</span></div>
        <div className="stat"><Heart size={18} /><b>{p.favoriteCount}</b><span>Favorites</span></div>
      </section>

      <section>
        <div className="row between"><h2 className="h-serif sub">Favorite foods</h2><Link to="/favorites" className="link-orange small">See all</Link></div>
        {favDishes.length === 0 ? <p className="muted small">No favorite dishes yet.</p> : (
          <div className="chips-wrap">{favDishes.slice(0, 6).map((d) => <Link key={d.dishId} to={`/dish/${d.dishId}`} className="chip">{d.name}</Link>)}</div>
        )}
        <h2 className="h-serif sub">Favorite restaurants</h2>
        {favRests.length === 0 ? <p className="muted small">No favorite restaurants yet.</p> : (
          <div className="chips-wrap">{favRests.map((r) => <Link key={r.restaurantId} to={`/restaurant/${r.restaurantId}`} className="chip">{r.name}</Link>)}</div>
        )}
      </section>

      <section>
        <div className="row between"><h2 className="h-serif sub">What I love to eat</h2><Link to="/onboarding/taste" state={{ editing: true }} className="link-orange small">Edit</Link></div>
        <div className="chips-wrap">{(taste.data?.foodTypes || []).length ? taste.data.foodTypes.map((t) => <Chip key={t.foodTypeId} on icon={UtensilsCrossed}>{t.name}</Chip>) : <p className="muted small">Nothing picked yet.</p>}</div>
      </section>

      <div className="stack profile-foot">
        <button type="button" className="link-red" onClick={doLogout}>Log out</button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile" footer={<Button block loading={saving} onClick={saveName}>Save changes</Button>}>
        <div className="stack">
          <FormField label="Full name" value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }} error={nameError} />
          <p className="muted xs">Your email or mobile number can't be changed here.</p>
        </div>
      </Sheet>
      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="Change password" footer={<Button block loading={saving} onClick={savePassword}>Change password</Button>}>
        <div className="stack">
          <FormField label="Current password" type="password" value={pw.currentPassword} onChange={(e) => { setPw((x) => ({ ...x, currentPassword: e.target.value })); setPwError(''); }} autoComplete="current-password" />
          <FormField label="New password" type="password" value={pw.newPassword} onChange={(e) => { setPw((x) => ({ ...x, newPassword: e.target.value })); setPwError(''); }} autoComplete="new-password" hint="At least 6 characters" />
          {pwError && <p className="form-alert" role="alert">{pwError}</p>}
        </div>
      </Sheet>
    </div>
  );
}
