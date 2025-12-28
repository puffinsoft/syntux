import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from 'esbuild-plugin-preserve-directives';

import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/client.ts"
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next", "getsyntux"],
  minify: true,
  bundle: true,
  metafile: true,
  esbuildPlugins: [
    preserveDirectivesPlugin({
      directives: ['use client', 'use strict'],
      include: /\.(js|ts|jsx|tsx)$/,
      exclude: /node_modules/,
    }),
  ],
  onSuccess: async () => {
    const src = path.resolve(__dirname, 'src/templates');
    const dest = path.resolve(__dirname, 'dist/templates');
    
    // Recursive copy (Node 16.7+)
    fs.cpSync(src, dest, { recursive: true });
    
    console.log('✅ Templates copied to dist/templates');
  }
});