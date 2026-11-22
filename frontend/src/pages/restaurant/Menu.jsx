import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import Chip from '../../components/common/Chip';
import SmartImage from '../../components/common/SmartImage';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ListSkeleton } from '../../components/loaders/Skeleton';
import useAsync from '../../hooks/useAsync';
import { myRestaurantService } from '../../services/myRestaurantService';
import { img } from '../../services/apiClient';
import { formatPrice } from '../../utils/helpers';

/**
 * The restaurant's own menu.
 *  GET /api/my-restaurant/categories + /dishes, PATCH .../availability, DELETE .../dishes/:id
 */
export default function Menu() {
  const [cat, setCat] = useState(null);           // null = All
  const cats = useAsync(() => myRestaurantService.categories(), []);
  const dishes = useAsync(() => myRestaurantService.dishes(cat), [cat]);
  const [toDelete, setToDelete] = useState(null);

  const toggleAvailable = async (d) => {
    try {
      const updated = await myRestaurantService.setAvailability(d.dishId, !d.isAvailable);
      dishes.setData((list) => list.map((x) => (x.dishId === d.dishId ? updated : x)));
    } catch (err) { toast.error(err.message); }
  };

  const remove = async () => {
    try {
      await myRestaurantService.deleteDish(toDelete.dishId);
      toast.success('Dish deleted');
      dishes.setData((list) => list.filter((x) => x.dishId !== toDelete.dishId));
      cats.reload();
    } catch (err) {
      toast.error(err.message);          // e.g. "already on bills or reviews - mark it Not available instead"
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="page">
      <div className="row between">
        <h1 className="h-serif">Your menu</h1>
        <Link to="/r/menu/new" className="icon-btn orange-fill" aria-label="Add dish"><Plus size={22} /></Link>
      </div>
      <div className="chips-scroll">
        <Chip on={cat === null} onClick={() => setCat(null)}>All</Chip>
        {(cats.data || []).map((c) => <Chip key={c.categoryId} on={cat === c.categoryId} onClick={() => setCat(c.categoryId)}>{c.name}</Chip>)}
      </div>

      {dishes.loading ? <ListSkeleton count={3} /> : dishes.error ? <ErrorState error={dishes.error} onRetry={dishes.reload} /> : dishes.data.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No dishes yet" text="Add your first dish with a photo and price so customers can find it." action={<Link to="/r/menu/new" className="btn btn-primary"><Plus size={18} /> Add dish</Link>} />
      ) : (
        <div className="list-grid">
          {dishes.data.map((f) => (
            <div key={f.dishId} className="menu-row card">
              <SmartImage src={img(f.photoUrl)} alt="" className="rest-thumb lg" />
              <div className="grow">
                <b>{f.name}</b>
                <p className="muted small">{f.categoryName || 'No category'} · {formatPrice(f.price)}</p>
                <button type="button" className={`status small ${f.isAvailable ? 'ok' : 'off'}`} onClick={() => toggleAvailable(f)} aria-label={`${f.name} is ${f.isAvailable ? 'available' : 'not available'}. Tap to change`}>● {f.isAvailable ? 'Available' : 'Not available'}</button>
              </div>
              <Link to={`/r/menu/${f.dishId}/edit`} className="icon-btn sm" aria-label={`Edit ${f.name}`}><Pencil size={16} /></Link>
              <button type="button" className="icon-btn sm danger" onClick={() => setToDelete(f)} aria-label={`Delete ${f.name}`}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)} title="Delete this dish?" danger confirmText="Delete"
        message={toDelete ? `"${toDelete.name}" will be removed from your menu.` : ''} onConfirm={remove}
      />
    </div>
  );
}
