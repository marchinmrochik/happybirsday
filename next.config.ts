import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.0.113"],
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
