import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Skeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { billService } from '../../services/billService';
import { formatPrice, shortDate } from '../../utils/helpers';

/**
 * The saved bill / receipt (GET /api/my-restaurant/bills/:id).
 * The 6 character code at the bottom is what the customer enters to review.
 */
export default function BillGenerated() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: bill, loading, error, reload } = useAsync(() => billService.get(id), [id]);

  if (loading) return <div className="page narrow-page"><Skeleton h={420} r={20} /></div>;
  if (error?.status === 404) return <div className="page"><EmptyState title="Bill not found" text="This bill does not exist for your restaurant." action={<Button onClick={() => navigate('/r/bill')}>New bill</Button>} /></div>;
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>;

  const date = new Date(bill.createdAt);
  return (
    <div className="page narrow-page">
      <header className="page-head no-print"><BackButton fallback="/r/bill" /><h1 className="h-serif">Bill #{bill.billNo}</h1></header>
      <div className="notice green no-print"><CheckCircle2 size={20} /><b>Bill saved</b></div>

      <motion.div className="receipt card" id="receipt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="h-serif center">{bill.restaurantName}</h2>
        <p className="muted small center">{bill.restaurantAddress}</p>
        <div className="dash" />
        <div className="row between small muted"><span>Bill #{bill.billNo}{bill.tableNo ? ` · Table ${bill.tableNo}` : ''}</span><span>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
        <div className="dash" />
        {bill.items.map((i) => (
          <div className="row between small receipt-line" key={i.billItemId}><span>{i.qty}x {i.dishName}{i.sizeLabel ? ` (${i.sizeLabel})` : ''}</span><span>{formatPrice(i.lineTotal)}</span></div>
        ))}
        <div className="dash" />
        <div className="row between"><b>Total</b><b className="price big">{formatPrice(bill.total)}</b></div>
        <div className="dash" />
        <p className="eyebrow center">Rate your food on CityBite</p>
        <div className="code-boxes small-boxes" aria-label={`Review code ${bill.reviewCode.split('').join(' ')}`}>{bill.reviewCode.split('').map((c, i) => <span key={i}>{c}</span>)}</div>
        <p className="muted xs center">Valid until {shortDate(bill.codeExpiresAt)} · used {bill.usedCount} of {bill.maxReviewers} times</p>
      </motion.div>

      <div className="row gap sticky-foot no-print">
        <Button variant="outline" block onClick={() => navigate('/r/bill')}>New bill</Button>
        <Button block icon={Printer} onClick={() => window.print()}>Print bill</Button>
      </div>
    </div>
  );
}
