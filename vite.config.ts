import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json' assert { type: 'json' };
import packageJson from './package.json';
import customRollupConfig from './rollup.config.js';
import path, { resolve } from 'path';
manifest.version = packageJson.version;

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd());
  return defineConfig({
    server: {
      watch: {
        ignored: ['**/dist/**', '**/public/**', '**/manifest.json'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/devtools_page/vue'),
      },
    },
    optimizeDeps: {
      include: ['webextension-polyfill'],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: customRollupConfig, // 使用自定义 Rollup 配置
    },
    plugins: [vue(), crx({ manifest })],
    define: {
      __Admine_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    // css: {
    //   preprocessorOptions: {
    //     scss: {
    //       additionalData: `@import "@/scss/main.scss";`,
    //     },
    //   },
    // },
  });
};
