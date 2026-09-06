import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Companion - Verified Social Companion Marketplace',
  description: 'Book 100% verified social companions for dining, movies, concerts, sightseeing, and public activities.',
  keywords: ['companion booking', 'verified companion', 'social activities', 'dinner partner', 'movie companion'],
  openGraph: {
    title: 'Companion - Verified Social Companion Marketplace',
    description: 'Book verified companions for public social activities.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

