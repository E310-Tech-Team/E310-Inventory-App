import type { NextConfig } from "next";
import path from "path";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
};

export default withPWA(nextConfig);
