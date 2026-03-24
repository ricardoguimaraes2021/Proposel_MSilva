import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Evita comportamento estranho quando o Next detecta root errado
  // (há múltiplos `package-lock.json` no sistema).
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      // Pedidos legacy a /favicon.ico passam a servir o PNG da marca
      { source: "/favicon.ico", destination: "/favicon.png", permanent: false },
    ];
  },
};

export default nextConfig;
