import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_PAGES === "true" ? "export" : "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: process.env.GITHUB_PAGES === "true",
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
