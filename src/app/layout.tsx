import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Paireva — Rent a Girlfriend. Rent a Boyfriend. Real People. Real Company.',
  description: 'Paireva is India’s premier verified companionship marketplace. Discover companions for coffee dates, events, conversations, and public social activities.',
  keywords: ['rent girlfriend', 'rent boyfriend', 'paireva', 'companion booking', 'social companion', 'verified companion', 'coffee date companion'],
  openGraph: {
    title: 'Paireva — Real People. Real Company.',
    description: 'Rent a Girlfriend. Rent a Boyfriend. Or just Some Company.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paireva — Real People. Real Company.',
    description: 'Rent a Girlfriend. Rent a Boyfriend. Or just Some Company.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${plusJakarta.variable} ${playfair.variable}`}>
      <head>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className="min-h-screen bg-[#FFF8F5] text-[#292126] antialiased selection:bg-[#E94B83] selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
