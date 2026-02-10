import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Transpile packages that need it
  transpilePackages: ['@excalidraw/excalidraw'],

  webpack: (config, { isServer }) => {
    // Excalidraw compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      ...(isServer ? {} : {
        'process/browser': require.resolve('process/browser'),
      }),
    };

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    // Handle Excalidraw's modules
    if (!isServer) {
      config.module.rules.push({
        test: /\.m?js$/,
        include: [
          /node_modules\/@excalidraw/,
          /node_modules\/(@excalidraw\/excalidraw)/,
        ],
        type: 'javascript/auto',
      });
    }

    return config;
  },
};

export default nextConfig;
