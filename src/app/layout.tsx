import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
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
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#F7F7F5] text-[#171717] font-sans selection:bg-[#111111] selection:text-white">
        {children}
      </body>
    </html>
  );
}
