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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-card w-full max-w-sm shadow-warm-lg border border-warm-200">
        <div className="p-4 border-b border-warm-200">
          <h3 className="font-bold text-base text-primary-700">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-primary-600">{message}</p>
        </div>
        <div className="p-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="btn-secondary text-sm px-4 py-2"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-2 rounded-button font-medium transition-colors ${
              danger
                ? 'bg-danger text-white hover:bg-red-600'
                : 'bg-primary text-white hover:bg-primary-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}