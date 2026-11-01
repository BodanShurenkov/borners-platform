import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BORNERS® — Strategy Platform (2026–2027)',
  description:
    'Платформа сценариев роста, разработки продукта, закупок и финансовой аналитики брендов BORNERS и НА ТЕЛЕ.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F7F5F0] text-[#1D1D1F] font-sans selection:bg-[#1D1D1F] selection:text-white">
        {children}
      </body>
    </html>
  );
}
