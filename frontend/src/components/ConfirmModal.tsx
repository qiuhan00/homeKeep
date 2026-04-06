interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-scale-in"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="p-6 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: danger ? 'var(--color-danger-light)' : 'var(--color-accent-light)' }}
          >
            {danger ? (
              <svg className="w-7 h-7 text-[#C74D3D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            ) : (
              <svg className="w-7 h-7 text-[#D4662B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26] mb-2">{title}</h3>
          <p className="text-sm text-[#6B6560]">{message}</p>
        </div>
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 btn-ghost py-3"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-medium text-white transition-all"
            style={danger ? { backgroundColor: 'var(--color-danger)' } : { backgroundColor: 'var(--color-accent)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}