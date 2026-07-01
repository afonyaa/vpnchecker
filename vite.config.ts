import { defineConfig } from "vite";

// Имя репозитория → проект публикуется на https://afonyaa.github.io/vpnchecker/,
// поэтому base должен совпадать с путём, иначе ассеты дадут 404.
// Метка сборки — чтобы на устройстве было видно, свежий ли бандл или отдаётся кэш.
const BUILD_ID = new Date().toISOString().slice(0, 16).replace("T", " ");

export default defineConfig({
  base: "/vpnchecker/",
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
});
