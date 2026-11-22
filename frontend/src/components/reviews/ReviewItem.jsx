import Stars from '../common/Stars';
import Badge from '../common/Badge';
import { img } from '../../services/apiClient';
import { timeAgo } from '../../utils/helpers';

/**
 * One customer review (ReviewDto from the API).
 * `meta` is extra grey text (e.g. "Verified bill · Chicken Karahi").
 */
export default function ReviewItem({ review, meta }) {
  // every review on CityBite comes from a bill; the dish reviews endpoint also says so with verifiedBill
  const verified = review.verifiedBill ?? true;
  return (
    <article className="review">
      <div className="review-top">
        <div className="row gap-sm wrap">
          <b>{review.userName}</b>
          {verified && <Badge variant="verified">Verified bill</Badge>}
        </div>
        <Stars value={review.rating} size={14} />
      </div>
      {review.comment && <p className="review-text">{review.comment}</p>}
      {review.photos?.length > 0 && (
        <div className="review-photos">{review.photos.map((p, i) => <img key={i} src={img(p)} alt="Customer" loading="lazy" />)}</div>
      )}
      <div className="review-foot">
        <span className="muted xs">{meta ? `${meta} · ` : ''}{timeAgo(review.createdAt)}</span>
      </div>
    </article>
  );
}
