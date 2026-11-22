import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Segmented from '../../components/common/Segmented';
import FormField from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { ROLES, homeFor } from '../../utils/constants';
import { validatePassword, validatePhoneOrEmail, hasErrors } from '../../utils/validators';

/** Login screen (POST /api/auth/login). Customer / Restaurant tabs at the top, same as the mockups. */
export default function Login() {
  const { login, user, startVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'restaurant' ? ROLES.owner : ROLES.customer);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // already logged in? go straight to the right home
  if (user) return <Navigate to={user.role === ROLES.owner ? '/r/bill' : location.state?.from || '/home'} replace />;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = { identifier: validatePhoneOrEmail(form.identifier), password: validatePassword(form.password) };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setLoading(true);
    try {
      const u = await login({ ...form, role });
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}!`);
      navigate(homeFor(u) === '/home' ? location.state?.from || '/home' : homeFor(u), { replace: true });
    } catch (err) {
      // 403 = the account exists but the number was never verified -> send a new code and show the OTP screen
      if (err.status === 403 && /verify/i.test(err.message)) {
        try {
          await startVerification(form.identifier, role);
          toast('Please verify your number first', { icon: '🔐' });
          navigate('/verify-otp');
          return;
        } catch (e2) { setFormError(e2.message); return; }
      }
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // quick fill for demos: these accounts exist after running the backend seed (dotnet run -- --seed-demo)
  const fillDemo = () => {
    setForm({ identifier: role === ROLES.customer ? '03001234567' : '03007654321', password: 'secret123' });
    setErrors({});
    setFormError('');
  };

  return (
    <AuthLayout>
      <h1 className="h-serif auth-title">Log in</h1>
      <Segmented options={[{ value: ROLES.customer, label: 'Customer' }, { value: ROLES.owner, label: 'Restaurant' }]} value={role} onChange={(r) => { setRole(r); setFormError(''); }} />
      <form onSubmit={submit} noValidate className="stack">
        <FormField label="Phone number or email" placeholder="03xx xxxxxxx or email" value={form.identifier} onChange={set('identifier')} error={errors.identifier} autoComplete="username" />
        <FormField label="Password" type="password" placeholder="Password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <div className="right"><Link to="/forgot-password" className="link-orange small">Forgot password?</Link></div>
        {formError && <p className="form-alert" role="alert">{formError}</p>}
        <Button type="submit" block loading={loading}>Log in</Button>
      </form>
      <p className="center muted">New here? <Link to={`/signup?role=${role === ROLES.owner ? 'restaurant' : 'customer'}`} className="link-orange">Sign up</Link></p>
      <div className="demo-box">
        <p className="xs muted">Demo account ({role === ROLES.owner ? 'restaurant' : 'customer'}) after seeding - password <b>secret123</b></p>
        <button type="button" className="link-orange small" onClick={fillDemo}>Fill demo login</button>
      </div>
    </AuthLayout>
  );
}
