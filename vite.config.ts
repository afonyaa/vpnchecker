import { defineConfig } from "vite";

// Имя репозитория → проект публикуется на https://afonyaa.github.io/vpnchecker/,
// поэтому base должен совпадать с путём, иначе ассеты дадут 404.
export default defineConfig({
  base: "/vpnchecker/",
});
