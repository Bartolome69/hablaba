/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/practice', destination: '/app/practice', permanent: true },
      { source: '/speak', destination: '/app/speak', permanent: true },
      { source: '/chat', destination: '/app/chat', permanent: true },
      // Criar was renamed to Grow; keep old links/bookmarks working
      { source: '/criar', destination: '/grow', permanent: true },
      { source: '/criar/:path*', destination: '/grow/:path*', permanent: true },
    ]
  },
}

export default nextConfig
