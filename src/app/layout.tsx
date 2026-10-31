import type { Metadata } from 'next';
import { Inter, Geist_Mono, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BORNERS GROUP — Платформа стратегии и разработки продукта (2026–2027)',
  description:
    'Закрытая веб-платформа стратегического управления, лаборатории продукта и бизнес-аналитики брендов BORNERS и НА ТЕЛЕ.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F8F6F2] text-[#161615] font-sans selection:bg-[#161615] selection:text-[#F8F6F2]">
        {children}
      </body>
    </html>
  );
}
