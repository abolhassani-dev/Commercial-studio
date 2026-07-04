'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'داشبورد' },
  { href: '/create', label: '✨ ساخت محتوا' },
  { href: '/identities', label: 'افراد' },
  { href: '/products', label: 'محصولات' },
  { href: '/brands', label: 'برندها' },
  { href: '/outputs', label: 'خروجی‌ها' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <span className="logo">🎬 استودیو AI</span>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
