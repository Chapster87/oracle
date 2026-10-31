import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const src = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": src,
      "@components": `${src}/components`,
      "@styles": `${src}/styles`,
      "@types": `${src}/types`,
    },
  },
})
