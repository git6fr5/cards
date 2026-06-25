'use client';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

const MAX_WIDTHS = {
  sm: 'max-w-modal-sm',
  md: 'max-w-modal-md',
  lg: 'max-w-modal-lg',
};

interface ProjectModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProjectModal({ title, onClose, children, footer, maxWidth = 'md', className = '' }: ProjectModalProps) {
  return (
    <div className="fixed inset-0 bg-project-black/50 flex items-center justify-center z-modal p-4">
      <div className={`bg-project-white border border-project-black w-full ${MAX_WIDTHS[maxWidth]} max-h-modal flex flex-col ${className}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-project-black shrink-0">
          <span className="font-bold text-sm text-project-black">{title}</span>
          <button onClick={onClose} className="p-1 hover:bg-project-black hover:text-project-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="border-t border-project-black shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
