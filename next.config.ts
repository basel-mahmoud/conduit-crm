import type { NextConfig } from "next";

// Clerk loads ClerkJS from the instance's Frontend API host and uses Cloudflare
// Turnstile for bot protection; these hosts must be allow-listed in the CSP.
const clerk = "https://*.clerk.accounts.dev https://*.clerk.com";
const turnstile = "https://challenges.cloudflare.com";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerk} ${turnstile}`,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${clerk} https://clerk-telemetry.com`,
  `frame-src 'self' ${clerk} ${turnstile}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // @react-pdf/renderer must not be bundled (native-ish deps / fonts).
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
