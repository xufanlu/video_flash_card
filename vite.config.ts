import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub project Pages URL: https://xufanlu.github.io/video_flash_card/
const repoBase = "/video_flash_card/";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? repoBase : "/",
});
