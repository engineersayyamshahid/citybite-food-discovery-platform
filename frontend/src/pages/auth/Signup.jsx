import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import useAuth from '../../hooks/useAuth';
import useApp from '../../hooks/useApp';
import { ROLES } from '../../utils/constants';
import { validateName, validatePassword, validatePhoneOrEmail, hasErrors } from '../../utils/validators';

/**
 * Sign up for customers (POST /api/auth/signup/customer) or restaurants (POST /api/auth/signup/restaurant, ?role=restaurant).
 * The backend sends an OTP; the account is active after the code is verified.
 */
export default function Signup() {
  const [params] = useSearchParams();
  const isResto = params.get('role') === 'restaurant';
  const role = isResto ? ROLES.owner : ROLES.customer;
  const { signup } = useAuth();
  const { areas } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', areaId: '', address: '', identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {
      name: validateName(form.name, isResto ? 'restaurant name' : 'name'),
      areaId: isResto && !form.areaId ? 'Choose your area' : '',
      address: isResto && form.address.trim().length < 3 ? 'Enter your restaurant address' : '',
      identifier: validatePhoneOrEmail(form.identifier),
      password: validatePassword(form.password),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setLoading(true);
    try {
      const sent = await signup({ ...form, role });
      toast(sent.devOtp ? `Demo mode: your code is ${sent.devOtp}` : 'We sent you a verification code', { icon: '🔐', duration: 5000 });
      navigate('/verify-otp');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout badge={<Badge variant={isResto ? 'green' : 'rank-soft'}>{isResto ? 'Restaurant' : 'Customer'}</Badge>}>
      <h1 className="h-serif auth-title">{isResto ? 'Set up your restaurant' : 'Create your account'}</h1>
      <form onSubmit={submit} noValidate className="stack">
        <FormField label={isResto ? 'Restaurant name' : 'Full name'} placeholder={isResto ? 'e.g. Tabaq Kitchen' : 'Your name'} value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        {isResto && (
          <>
            <FormField
              label="Area" icon={MapPin} value={form.areaId} onChange={set('areaId')} error={errors.areaId}
              options={[{ value: '', label: 'Choose your area' }, ...areas.map((a) => ({ value: a.areaId, label: `${a.name}, ${a.city}` }))]}
            />
            <FormField label="Address" placeholder="Shop, street, e.g. Shop 4, Cantt Road" value={form.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
          </>
        )}
        <FormField label="Phone number or email" placeholder="03xx xxxxxxx or email" value={form.identifier} onChange={set('identifier')} error={errors.identifier} autoComplete="username" />
        <FormField label="Password" type="password" placeholder="Create a password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" hint="At least 6 characters" />
        {formError && <p className="form-alert" role="alert">{formError}</p>}
        <Button type="submit" block loading={loading}>{isResto ? 'Create restaurant account' : 'Sign up'}</Button>
      </form>
      <p className="center muted">Have an account? <Link to={`/login?role=${isResto ? 'restaurant' : 'customer'}`} className="link-orange">Log in</Link></p>
      <p className="center xs muted">{isResto ? <Link to="/signup?role=customer" className="link-orange">Sign up as a customer instead</Link> : <Link to="/signup?role=restaurant" className="link-orange">Own a restaurant? Sign up here</Link>}</p>
    </AuthLayout>
  );
}
