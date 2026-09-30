import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Promotion Agent · Review',
  description: 'Review promotion work and continue in your agent.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
