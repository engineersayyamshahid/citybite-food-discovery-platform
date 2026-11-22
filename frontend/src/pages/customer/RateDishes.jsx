import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import SmartImage from '../../components/common/SmartImage';
import StarInput from '../../components/reviews/StarInput';
import PhotoPicker from '../../components/forms/PhotoPicker';
import FormField from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { reviewService } from '../../services/reviewService';
import { img } from '../../services/apiClient';

/**
 * Add review step 2: 1-5 stars for every dish on the bill, photos, one comment.
 *  - the bill is loaded again with POST /api/reviews/redeem (safe to repeat, so a page refresh works)
 *  - POST /api/reviews saves all ratings, then each photo is uploaded to POST /api/reviews/{id}/photos
 */
export default function RateDishes() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: bill, loading, error } = useAsync(() => reviewService.redeem(code), [code]);
  const [ratings, setRatings] = useState({});
  const [photos, setPhotos] = useState({});       // billItemId -> { file, preview }
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="page narrow-page"><ListSkeleton count={2} /></div>;
  const items = bill ? bill.items.filter((i) => !i.alreadyRated) : [];
  if (!saving && (error || !bill || items.length === 0)) {
    return (
      <div className="page narrow-page">
        <EmptyState
          icon={LockKeyhole} title="This bill can't be reviewed"
          text={error?.message || 'You have already rated every dish on this bill.'}
          action={<Link to="/reviews/add" className="btn btn-primary">Try another code</Link>}
        />
      </div>
    );
  }

  const submit = async () => {
    const missing = items.filter((i) => !ratings[i.billItemId]);
    if (missing.length) return setFormError(`Please rate ${missing.map((m) => m.dishName).join(', ')}`);
    setSaving(true);
    setFormError('');
    try {
      const created = await reviewService.submit(bill.billId, items.map((i) => ({ billItemId: i.billItemId, rating: ratings[i.billItemId], comment: comment.trim() || null })));
      // photos can only be added after the review exists
      let failed = 0;
      for (const c of created) {
        const p = photos[c.billItemId];
        if (p?.file) {
          try { await reviewService.addPhoto(c.reviewId, p.file); } catch (e) { failed += 1; }
        }
      }
      toast.success(failed ? 'Review saved, but a photo could not be uploaded.' : 'Thank you! Your review is live.');
      navigate('/reviews', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="page narrow-page">
      <PageHeader title="Rate your food" fallback="/reviews/add" />
      <p className="green-text bold small"><CheckCircle2 size={16} className="inline" /> Verified bill · {bill.restaurantName} · Bill #{bill.billNo}</p>

      <div className="stack">
        {items.map((i) => (
          <div key={i.billItemId} className="card rate-card">
            <div className="row between">
              <div className="row gap-sm"><SmartImage src={img(i.photoUrl)} alt="" className="rest-thumb" /><b>{i.dishName}</b></div>
              <StarInput value={ratings[i.billItemId] || 0} onChange={(n) => { setRatings((r) => ({ ...r, [i.billItemId]: n })); setFormError(''); }} size={24} label={`Rate ${i.dishName}`} />
            </div>
            <PhotoPicker value={photos[i.billItemId]?.preview} onChange={(file, preview) => setPhotos((p) => ({ ...p, [i.billItemId]: { file, preview } }))} />
          </div>
        ))}
      </div>

      <FormField textarea rows={4} label="Comment (optional)" placeholder="Tell others what you liked" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      {formError && <p className="form-alert" role="alert">{formError}</p>}
      <div className="sticky-foot"><Button block loading={saving} onClick={submit}>Submit review</Button></div>
    </div>
  );
}
