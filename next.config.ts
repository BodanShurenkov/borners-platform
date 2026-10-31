import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export",
        distDir: "out-gh-pages",
        basePath: "/borners-platform",
        assetPrefix: "/borners-platform/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  allowedDevOrigins: [
    "*.serveousercontent.com",
    "*.serveo.net",
    "*.lhr.life",
    "*.localhost.run",
    "localhost:3000",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
