import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PieceFilterDefs from './_components/Piece/PieceFilterDefs';
import './globals.css';

export const metadata: Metadata = {
  title: 'App',
  description: '',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <PieceFilterDefs />
        {children}
      </body>
    </html>
  );
}
