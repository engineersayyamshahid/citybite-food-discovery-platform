import Sheet from './Sheet';
import Button from './Button';

/** "Are you sure?" popup for things like deleting a dish */
export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="muted">{message}</p>
      <div className="row gap" style={{ marginTop: 20 }}>
        <Button variant="outline" block onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} block onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Sheet>
  );
}
