import { defineConfig } from "vite";

export default defineConfig({
    base: "/russian-spelling-practice/", // Updated for spelling practice app
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: "./index.html",
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        },
        // Ensure TypeScript files are properly processed
        sourcemap: true
    },
    publicDir: "public",
    server: {
        open: true
    }
});