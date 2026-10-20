import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js and the Remotion packages ship modern ESM; let Next transpile them for the browser build.
  transpilePackages: ["three"],
};

export default nextConfig;
