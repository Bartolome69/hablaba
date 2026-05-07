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
    ]
  },
}

export default nextConfig
