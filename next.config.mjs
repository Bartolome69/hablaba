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
      // The Grow module collapsed into the main app (IA restructure): its data
      // migrated into conversations/phrases/profile, its routes map to the
      // unified surfaces. /criar was Grow's pre-rename path — chain it too.
      { source: '/grow/voice/semana', destination: '/app/semana', permanent: true },
      { source: '/grow/voice/historial', destination: '/app/charla/historial', permanent: true },
      { source: '/grow/voice/:path*', destination: '/app/charla', permanent: true },
      { source: '/grow/sparring', destination: '/app/charla', permanent: true },
      { source: '/grow/journal', destination: '/app/speak', permanent: true },
      { source: '/grow', destination: '/app/today', permanent: true },
      { source: '/grow/:path*', destination: '/app/today', permanent: true },
      { source: '/criar', destination: '/app/today', permanent: true },
      { source: '/criar/:path*', destination: '/app/today', permanent: true },
    ]
  },
}

export default nextConfig
