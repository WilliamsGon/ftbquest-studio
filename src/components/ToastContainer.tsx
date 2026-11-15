

export interface ToastContainerProps {
  toasts: { id: string; message: string; type: string; }[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <>
      <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <p className="toast-message">{t.message}</p>
        </div>
      ))}
    </div>
    </>
  );
}
