import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import usePaged from '../../hooks/usePaged';
import { billService } from '../../services/billService';
import { formatPrice, shortDate } from '../../utils/helpers';

/** Past bills (GET /api/my-restaurant/bills) - tap one to reprint it. */
export default function BillHistory() {
  const list = usePaged((page) => billService.list(page), []);
  return (
    <div className="page narrow-page">
      <PageHeader title="Bill history" fallback="/r/bill" />
      {list.loading ? <ListSkeleton count={4} /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : list.items.length === 0 ? (
        <EmptyState icon={Receipt} title="No bills yet" text="Bills you generate appear here." action={<Link to="/r/bill" className="btn btn-primary">Generate a bill</Link>} />
      ) : (
        <>
          <div className="list-grid">
            {list.items.map((b) => (
              <Link key={b.billId} to={`/r/bill/${b.billId}`} className="menu-row card hoverable">
                <span className="loc-ic"><Receipt size={20} /></span>
                <div className="grow"><b>Bill #{b.billNo}{b.tableNo ? ` · Table ${b.tableNo}` : ''}</b><p className="muted small">{shortDate(b.createdAt)} · {b.itemCount} items · code {b.reviewCode} · used {b.usedCount}x</p></div>
                <b className="price">{formatPrice(b.total)}</b>
              </Link>
            ))}
          </div>
          {list.hasMore && <div className="center" style={{ marginTop: 16 }}><Button variant="outline" loading={list.loadingMore} onClick={list.loadMore}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}
