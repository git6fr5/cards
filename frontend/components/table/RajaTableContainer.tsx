import type { ReactNode } from 'react';

interface RajaTableContainerProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function RajaTableContainer({ children, footer, className = '' }: RajaTableContainerProps) {
  return (
    <div className={`flex flex-col border border-raja-chrome-border ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
      {footer && (
        <div className="border-t border-raja-chrome-border">
          {footer}
        </div>
      )}
    </div>
  );
}
