import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Transpile Three.js ecosystem packages */
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  
  webpack: (config) => {
    // Support WASM files (for Stockfish)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
