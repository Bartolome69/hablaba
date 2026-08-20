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
      { source: '/practice', destination: '/app/today', permanent: true },
      { source: '/speak', destination: '/app/speak', permanent: true },
      { source: '/chat', destination: '/app/charla', permanent: true },
      // Practice split into Today (the dashboard) and Charlar (conversations),
      // and text chat merged into a conversation thread.
      { source: '/app/practice', destination: '/app/today', permanent: true },
      { source: '/app/chat', destination: '/app/charla', permanent: true },
      // Criar was renamed to Grow; keep old links/bookmarks working
      { source: '/criar', destination: '/grow', permanent: true },
      { source: '/criar/:path*', destination: '/grow/:path*', permanent: true },
    ]
  },
}

export default nextConfig
