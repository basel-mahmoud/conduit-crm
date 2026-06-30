import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer must not be bundled (native-ish deps / fonts).
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
