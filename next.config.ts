import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Especifica o diretório raiz do projeto para evitar avisos sobre múltiplos lockfiles
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
