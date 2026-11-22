// Form validation helpers - each one returns an error message or '' if all good

export const normalizeId = (v = '') => v.trim().toLowerCase().replace(/[\s-]/g, '');

export const isPhone = (v) => /^(03\d{9}|\+923\d{9})$/.test(normalizeId(v));
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const validatePhoneOrEmail = (v) => {
  if (!v.trim()) return 'Enter your phone number or email';
  if (!isPhone(v) && !isEmail(v)) return 'Use a phone like 03xx xxxxxxx or a valid email';
  return '';
};

export const validatePassword = (v) => {
  if (!v) return 'Enter your password';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateName = (v, label = 'name') => {
  if (!v.trim()) return `Enter your ${label}`;
  if (v.trim().length < 2) return `${label[0].toUpperCase() + label.slice(1)} is too short`;
  return '';
};

export const validatePrice = (v) => {
  if (v === '' || v === null || v === undefined) return 'Enter a price';
  if (Number.isNaN(Number(v)) || Number(v) <= 0) return 'Price must be more than 0';
  return '';
};

/** Run many validators at once: validateAll({ name: ['x', fn] }) -> { name: 'error' } */
export const hasErrors = (errors) => Object.values(errors).some(Boolean);
