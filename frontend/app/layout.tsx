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
      <body>
        <PieceFilterDefs />
        {children}
      </body>
    </html>
  );
}
