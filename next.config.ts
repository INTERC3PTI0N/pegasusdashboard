import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Course videos live outside /public so they are never served as static files;
  // bundle them with the gated media route instead.
  outputFileTracingIncludes: {
    '/api/media/[slug]/[lessonId]': ['./media/**'],
  },
};

export default nextConfig;
