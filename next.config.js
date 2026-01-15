/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', process.env.NEXTAUTH_URL],
  },
}

module.exports = nextConfig

