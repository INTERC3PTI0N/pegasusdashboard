import type { Metadata } from 'next';
import { Jost, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pegasus Academy — Customer Portal',
  description:
    'The Pegasus Hair Tools customer academy. Exclusive tutorials, guides and certification for owners of Pegasus professional styling tools.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jost.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
