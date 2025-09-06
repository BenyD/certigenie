import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist/build/pdf.worker.entry":
          "pdfjs-dist/build/pdf.worker.min.js",
      };
    }

    return config;
  },
  // Turbopack configuration to match webpack setup
  experimental: {
    turbo: {
      resolveAlias: {
        "pdfjs-dist/build/pdf.worker.entry":
          "pdfjs-dist/build/pdf.worker.min.js",
      },
    },
  },
  // Add headers for PDF.js worker
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
