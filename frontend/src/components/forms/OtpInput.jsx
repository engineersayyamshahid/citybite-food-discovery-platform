import { useRef } from 'react';

/** 4-digit code boxes. Moves to the next box automatically and supports paste + backspace. */
export default function OtpInput({ value, onChange, length = 4, error }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (i, ch) => {
    const arr = [...digits];
    arr[i] = ch;
    onChange(arr.join(''));
  };

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    setAt(i, ch);
    if (ch && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (text) {
      e.preventDefault();
      onChange(text);
      refs.current[Math.min(text.length, length - 1)]?.focus();
    }
  };

  return (
    <div className={`otp ${error ? 'has-error' : ''}`} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i} ref={(el) => { refs.current[i] = el; }} className={`otp-box ${d ? 'filled' : ''}`}
          inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} value={d}
          aria-label={`Digit ${i + 1}`} onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKey(i, e)}
        />
      ))}
    </div>
  );
}
