'use client';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

const MAX_WIDTHS = {
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
};

interface KingkillerModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function KingkillerModal({ title, onClose, children, footer, maxWidth = 'md', className = '' }: KingkillerModalProps) {
  return (
    <div className="fixed inset-0 bg-kingkiller-black/50 flex items-center justify-center z-modal p-4">
      <div className={`bg-kingkiller-white border border-kingkiller-black w-full ${MAX_WIDTHS[maxWidth]} max-h-modal flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-kingkiller-black shrink-0">
          <span className="font-bold text-sm text-kingkiller-black">{title}</span>
          <button onClick={onClose} className="p-1 hover:bg-kingkiller-black hover:text-kingkiller-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="border-t border-kingkiller-black shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
