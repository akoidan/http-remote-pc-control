const esbuild = require('esbuild');
const {resolve} = require('path');
const fs = require('fs/promises');


async function main() {
  const result = await esbuild.build({
    entryPoints: [resolve(__dirname, 'dist', 'main.js')],
    bundle: true,
    outfile: resolve(__dirname,  'dist', 'sea-bundle.js'),
    platform: 'node',
    metafile: true,
    target: 'node24',
    format: 'cjs',
    external: [
      'fs', 'path', 'nestjs/cli', 'process', 'node:process', 'node:os', 'node:path',  'node:sea', 'node:fs', 'node:readline', 'node:module',
      'http', 'https', 'url', 'util', 'stream', 'crypto', 'zlib', 'net', 'tls', 'dns',
      'async_hooks', 'querystring', 'events', 'buffer', 'child_process', 'cluster',
      'dgram', 'inspector', 'module', 'os', 'perf_hooks', 'readline', 'repl',
      'string_decoder', 'timers', 'trace_events', 'tty', 'v8', 'vm', 'wasi', 'worker_threads',
      // Externalize optional NestJS packages, nestjs does () => require('dependency')
      // which confuses esbuild trying to resolve it
      '@nestjs/websockets', '@nestjs/microservices', '@nestjs/websockets/socket-module',
      '@nestjs/microservices/microservices-module', 'class-validator', 'class-transformer',
      '@nestjs/config', 'bindings'
    ],
    plugins: [
      {
        name: 'alias-plugin',
        setup(build) {
          build.onResolve({filter: /^@\/(.*)$/}, (args) => {
            const path = args.path.slice(2); // Remove '@/'
            return {path: resolve(__dirname, 'dist', path + '.js')};
          });
        },
      },
      {
        name: 'jsonc-parser-esm',
        setup(build) {
          build.onResolve({filter: /^jsonc-parser$/}, (args) => {
            // Redirect to the ESM version which bundles better
            return {path: resolve(__dirname, 'node_modules/jsonc-parser/lib/esm/main.js')};
          });
        },
      },
    ],
    logLevel: 'info'
  })
  await fs.writeFile(resolve(__dirname,  'dist', 'esbuild.json'), JSON.stringify(result.metafile, null, 2))
  const analysis = await esbuild.analyzeMetafile(result.metafile, { verbose: true });
  await fs.writeFile(resolve(__dirname,  'dist', 'esbuild.txt'), analysis);
}

main();
