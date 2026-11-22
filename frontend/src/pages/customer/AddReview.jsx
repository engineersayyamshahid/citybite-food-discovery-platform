import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import SmartImage from '../../components/common/SmartImage';
import Button from '../../components/common/Button';
import { reviewService } from '../../services/reviewService';
import { img } from '../../services/apiClient';
import { formatPrice, shortDate } from '../../utils/helpers';

/**
 * Add review step 1: type the 6 character code printed on the bill.
 * POST /api/reviews/redeem checks the code on the server (exists, not expired, max 4 people) and returns the dishes.
 */
export default function AddReview() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);   // { bill } or { error }
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setResult(null);
  };

  const find = async (e) => {
    e?.preventDefault();
    if (code.length < 6) return;
    setLoading(true);
    try {
      setResult({ bill: await reviewService.redeem(code) });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const bill = result?.bill;
  const rateable = bill ? bill.items.filter((i) => !i.alreadyRated) : [];

  return (
    <div className="page narrow-page">
      <PageHeader title="Add review" fallback="/reviews" />
      <form onSubmit={find} className="stack">
        <label className="eyebrow" htmlFor="bill-code">Bill code</label>
        <input
          id="bill-code" className={`code-input ${bill ? 'ok' : ''} ${result?.error ? 'bad' : ''}`} value={code} onChange={onChange}
          placeholder="— — — — — —" autoComplete="off" autoCapitalize="characters" spellCheck="false" inputMode="text" aria-describedby="code-help"
        />
        <p id="code-help" className="muted xs center">Find the 6 character code at the bottom of your printed bill. A code works for 7 days and up to 4 people. Demo codes (after seeding): <b>K7M4QX</b>, <b>H4P9ZD</b></p>

        <AnimatePresence mode="wait">
          {result?.error && (
            <motion.div key="err" className="notice red" role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AlertCircle size={20} /><div><b>Can't use this code</b><p className="small">{result.error}</p></div>
            </motion.div>
          )}
          {bill && (
            <motion.div key="ok" className="stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="notice green">
                <CheckCircle2 size={20} />
                <div><b>Bill found</b><p className="small">{bill.restaurantName} · Bill #{bill.billNo} · {shortDate(bill.billDate)}</p></div>
              </div>
              <p className="eyebrow">Dishes on your bill</p>
              <div className="card bill-dishes">
                {bill.items.map((i) => (
                  <div className="bill-dish" key={i.billItemId}>
                    <SmartImage src={img(i.photoUrl)} alt="" className="rest-thumb" />
                    <div className="grow"><b>{i.dishName}</b><p className="muted small">{i.sizeLabel ? `${i.sizeLabel} · ` : ''}Qty {i.qty}{i.alreadyRated ? ' · Rated ✓' : ''}</p></div>
                    <b>{formatPrice(i.lineTotal)}</b>
                  </div>
                ))}
              </div>
              {rateable.length === 0 && <p className="muted small center">You already rated every dish on this bill. Thank you!</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="sticky-foot">
          {bill && rateable.length > 0
            ? <Button type="button" block onClick={() => navigate(`/reviews/rate/${code}`)}>Rate these {rateable.length} {rateable.length === 1 ? 'dish' : 'dishes'}</Button>
            : <Button type="submit" block disabled={code.length < 6} loading={loading}>Find bill</Button>}
        </div>
      </form>
    </div>
  );
}
