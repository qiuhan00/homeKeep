import { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-card w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-warm-lg border border-warm-200">
        <div className="p-4 border-b border-warm-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-primary-700">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-warm-100 rounded text-primary-500"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}