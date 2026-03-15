import tailwindcss from "@tailwindcss/vite";

export default {
  root: "src",
  publicDir: "../public",
  plugins: [tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
};
