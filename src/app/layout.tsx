import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'استودیو تبلیغاتی AI',
  description: 'Personal AI Commercial Studio — تولید سریع محتوای تبلیغاتی با هوش مصنوعی',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
