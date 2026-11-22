import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, X } from 'lucide-react';
import { compressImageFile } from '../../utils/helpers';

/**
 * "Add photo" box. Picks an image, shrinks it, and gives back the File (to upload to the backend)
 * and a preview address to show on screen:   onChange(file, previewUrl)   -  or onChange(null, null) when removed.
 * `value` is the preview to show (a blob: address, or the photo that is already saved on the server).
 * variant: 'box' (small square, for reviews) | 'wide' (big dashed area, for dishes)
 */
export default function PhotoPicker({ value, onChange, variant = 'box', label = 'Add photo' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image (JPG, PNG or WEBP)');
    setBusy(true);
    try {
      const small = await compressImageFile(file);
      onChange(small, URL.createObjectURL(small));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`photo-picker photo-${variant}`}>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
      {value ? (
        <div className="photo-preview">
          <img src={value} alt="Selected" />
          <button type="button" className="photo-remove" aria-label="Remove photo" onClick={() => onChange(null, null)}><X size={14} /></button>
        </div>
      ) : (
        <button type="button" className="photo-add" onClick={() => input.current?.click()} disabled={busy}>
          <Camera size={variant === 'wide' ? 26 : 20} />
          <span>{busy ? 'Loading...' : label}</span>
        </button>
      )}
    </div>
  );
}
