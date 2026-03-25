import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // This is the whitelist Next.js needs to allow the connection
  allowedDevOrigins: [
    'ocean-scrounger-phony.ngrok-free.dev',
    'localhost:3000'
  ],
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:3001/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
