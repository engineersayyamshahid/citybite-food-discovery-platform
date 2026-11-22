import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import OtpInput from '../../components/forms/OtpInput';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

/**
 * 4-digit code screen (POST /api/auth/verify-otp, resend: POST /api/auth/resend-otp).
 * In offline demo mode the backend returns the code as "devOtp" and we show it on screen.
 */
export default function VerifyOtp() {
  const { pending, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(24);

  // resend countdown
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  if (!pending) return <Navigate to="/signup" replace />;

  const verify = async () => {
    if (code.length < 4) return setError('Enter all 4 digits');
    setLoading(true);
    try {
      const u = await verifyOtp(code);
      toast.success('Account verified. Welcome to CityBite!');
      navigate(u.role === ROLES.owner ? '/r/menu' : '/onboarding/location', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const sent = await resendOtp();
      setSeconds(24);
      setCode('');
      setError('');
      toast(sent.devOtp ? `Demo mode: your code is ${sent.devOtp}` : 'We sent a new code', { icon: '🔐' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout backTo={`/signup?role=${pending.role === ROLES.owner ? 'restaurant' : 'customer'}`}>
      <h1 className="h-serif auth-title" style={{ marginTop: 28 }}>Verify your {pending.identifier.includes('@') ? 'email' : 'number'}</h1>
      <p className="muted">Enter the 4-digit code we sent to <b className="ink">{pending.identifier}</b></p>
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(''); }} error={error} />
      {error && <p className="field-error center" role="alert">{error}</p>}
      <p className="center muted">
        {seconds > 0 ? <>Resend code in <b className="ink">0:{String(seconds).padStart(2, '0')}</b></> : <button type="button" className="link-orange" onClick={resend}>Resend code</button>}
      </p>
      {pending.devOtp && <div className="demo-box"><p className="xs muted">Offline demo mode - no SMS is sent. Your code is <b>{pending.devOtp}</b>.</p></div>}
      <div className="auth-bottom"><Button block loading={loading} onClick={verify} disabled={code.length < 4}>Verify</Button></div>
    </AuthLayout>
  );
}
