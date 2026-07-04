/** @type {import('next').NextConfig} */
const nextConfig = {
  // خروجی‌های تولیدشده (عکس/ویدیو) از دامنه‌های ارائه‌دهنده‌ها لود می‌شوند
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
};

export default nextConfig;
