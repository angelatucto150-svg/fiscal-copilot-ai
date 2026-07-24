import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Permite que consultarRuc() lea USE_REAL_API también en el cliente
  env: {
    USE_REAL_API: process.env.USE_REAL_API,
  },
};

export default nextConfig;
