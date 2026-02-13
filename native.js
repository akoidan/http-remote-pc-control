#!/usr/bin/env node

const {execSync} = require('child_process');
const sentinel = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';
console.log('Creating sea applicaiton from js files ...');
execSync("node --experimental-sea-config sea-config.json", {stdio: 'inherit'});
console.log('Copying node interpterer to dist/native.exe ...');
require('fs').copyFileSync(process.execPath, 'dist/native.exe')
console.log('Injecting sea blob to node executable ...');
let command;
if (process.platform == 'linux') {
  command = `node ./node_modules/.bin/postject dist/native.exe NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse ${sentinel}`;
  execSync(command, {stdio: 'inherit'});
} else {
  execSync(
    `cmd.exe /c .\\node_modules\\.bin\\postject.cmd dist\\native.exe NODE_SEA_BLOB dist\\sea-prep.blob --sentinel-fuse ${sentinel}`,
    { stdio: 'inherit' }
  );
}

console.log('Moving file to project directory ...');
// Move/rename the executable
const out = process.platform == 'win32' ? 'http-remote-pc-control.exe' : 'http-remote-pc-control';
require('fs').renameSync('dist/native.exe', out);
console.log(`✅ Created binary file: ${out}`);
