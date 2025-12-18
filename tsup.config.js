import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/plugin.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
  bundle: true, 
  treeshake: true,
  loader: {
    ".md": "text"
  },
});