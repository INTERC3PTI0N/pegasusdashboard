import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Course videos live outside /public so they are never served as static files;
  // bundle them with the gated media route instead.
  // Media library uploads go through server actions (default limit is 1 MB).
  experimental: { serverActions: { bodySizeLimit: '4.5mb' } },
  // Media-library uploads are referenced as /cms-media/<id> (same paths the public site uses).
  // Courses are unlocked by kits now: old /products and /register-product links keep working.
  async redirects() {
    return [
      { source: '/products/:path*', destination: '/courses/:path*', permanent: true },
      { source: '/register-product', destination: '/register-kit', permanent: true },
      { source: '/courses/precision-cutting/:path*', destination: '/courses/essential', permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: '/cms-media/:id', destination: '/api/site/media/:id' }];
  },
  outputFileTracingIncludes: {
    '/api/media/[slug]/[lessonId]': ['./media/**'],
  },
};

export default nextConfig;
