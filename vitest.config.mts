import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: 'web',
          include: ['__tests__/lib/**/*.test.ts', '__tests__/components/**/*.test.tsx'],
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
          clearMocks: true,
        },
      },
      {
        resolve: {
          alias: [
            { find: 'server-only', replacement: local('./server/src/server-only.ts') },
            { find: '@', replacement: local('./') },
          ],
        },
        test: {
          name: 'api',
          include: ['__tests__/api/**/*.test.ts', 'server/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['./vitest.setup.ts'],
          clearMocks: true,
        },
      },
    ],
  },
});
