import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/forms/FormField';
import OtpInput from '../../components/forms/OtpInput';
import Button from '../../components/common/Button';
import { authService } from '../../services/authService';
import { validatePassword, validatePhoneOrEmail } from '../../utils/validators';

/**
 * Reset password in two steps:
 *  1. POST /api/auth/forgot-password  -> backend creates a code (shown as devOtp in offline demo mode)
 *  2. POST /api/auth/reset-password   -> code + new password
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [value, setValue] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    const err = validatePhoneOrEmail(value);
    setError(err);
    if (err) return;
    setLoading(true);
    try {
      const sent = await authService.forgotPassword(value);
      setDevOtp(sent.devOtp);
      setStep(2);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    const err = code.length < 4 ? 'Enter the 4-digit code' : validatePassword(password);
    setError(err);
    if (err) return;
    setLoading(true);
    try {
      await authService.resetPassword({ emailOrPhone: value, code, newPassword: password });
      toast.success('Password changed. You can log in now.');
      navigate('/login', { replace: true });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout backTo="/login">
      <h1 className="h-serif auth-title" style={{ marginTop: 28 }}>Reset password</h1>
      {step === 1 ? (
        <form onSubmit={sendCode} noValidate className="stack">
          <p className="muted">Enter your phone number or email and we'll send you a code.</p>
          <FormField label="Phone number or email" placeholder="03xx xxxxxxx or email" value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} error={error} />
          <Button type="submit" block loading={loading}>Send code</Button>
        </form>
      ) : (
        <form onSubmit={reset} noValidate className="stack">
          <p className="muted">Enter the 4-digit code we sent to <b className="ink">{value}</b> and choose a new password.</p>
          <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} error={error && code.length < 4} />
          {devOtp && <div className="demo-box"><p className="xs muted">Offline demo mode - no SMS is sent. Your code is <b>{devOtp}</b>.</p></div>}
          <FormField label="New password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="new-password" />
          {error && <p className="form-alert" role="alert">{error}</p>}
          <Button type="submit" block loading={loading}>Change password</Button>
          <Link to="/login" className="link-plain center">Back to log in</Link>
        </form>
      )}
    </AuthLayout>
  );
}
