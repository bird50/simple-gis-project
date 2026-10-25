import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@thaiwater/toolbox-sdk"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
