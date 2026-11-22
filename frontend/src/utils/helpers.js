// Small helper functions used all over the app

/** Format a number as Pakistani rupees, e.g. 1200 -> "Rs. 1,200" */
export const formatPrice = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US')}`;

/** Rating from the backend (decimal) -> "4.8" */
export const fmtRating = (n) => Number(n || 0).toFixed(1);

/** "2 days ago" for recent dates, "12 Oct" for older ones. The backend sends UTC dates. */
export const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 14) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** The backend sends plain dates like "2026-11-14" (promotions) */
export const shortDateOnly = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** "14:00" -> "2:00 PM" (used on the opening hours screen) */
export const to12h = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
};

/** "11:00 AM" (what the backend returns) -> "11:00" (what <input type=time> and the PUT request use) */
export const to24h = (text) => {
  if (!text) return '';
  const m = text.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '';
  let h = Number(m[1]);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

/** Initials for logo placeholders: "Tabaq Kitchen" -> "TK" */
export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/**
 * Shrinks a photo before upload (max 1280px, JPEG) and returns a File.
 * Keeps uploads small and fast - the backend accepts up to 5 MB.
 */
export const compressImageFile = (file, maxSize = 1280) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this photo')); };
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' })) : reject(new Error('Could not process this photo'))),
        'image/jpeg',
        0.82
      );
    };
    image.src = url;
  });

/** Builds multipart form data with one field called "file" (what the backend expects) */
export const fileForm = (file) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};
