import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Auto-memoizes components and hooks at build time so manual useMemo/useCallback
  // are no longer required for correctness or render performance.
  // `critical_errors` fails the build on real compiler errors instead of silently
  // skipping the component; non-critical bailouts are still skipped.
  reactCompiler: {
    panicThreshold: 'critical_errors',
  },
};

export default nextConfig;
