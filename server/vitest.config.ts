import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const sharedTypes = path.resolve(rootDir, '../shared/types.ts');

export default defineConfig({
  resolve: {
    alias: {
      '../../shared/types.js': sharedTypes,
      '../../../shared/types.js': sharedTypes,
    },
  },
});
