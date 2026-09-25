import { build, context } from 'esbuild';

const options = {
  entryPoints: ['server/src/main.ts'],
  outfile: 'server/dist/main.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  tsconfig: 'server/tsconfig.json',
};
if (process.argv.includes('--watch')) {
  const builder = await context(options);
  await builder.watch();
} else {
  await build(options);
}
