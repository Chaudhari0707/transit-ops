import type { NextConfig } from "next";

/**
 * Next 16 blocks cross-origin access to dev HMR by default.
 * Opening the app via LAN IP (e.g. http://192.168.1.10:3000) without this
 * breaks WebSocket HMR and can leave client pages stuck / not hydrating.
 * Extra hosts: ALLOWED_DEV_ORIGINS=host1,host2
 */
const extraDevOrigins =
  Bun.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? [];

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.10", ...extraDevOrigins],
};

export default nextConfig;
