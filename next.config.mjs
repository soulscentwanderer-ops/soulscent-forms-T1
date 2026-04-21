/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/t1',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
