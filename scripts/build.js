import fs from 'fs'
import { promisify } from 'util'
import j2s from 'json2server'
import pkg from '../package.json'
import serverJson from '../src/server.json'
import configJson from '../src/j2s.json'

const replace = j2s.methods.replace
const writeFile = promisify(fs.writeFile)


async function main() {
  serverJson.root.$ = { name: pkg.name, version: pkg.version }
  configJson.mountpath = `/api/v${Number(pkg.version.split('.').shift())+1}`;
  configJson.loglevel = 2;
  configJson.moduledir = 'modules';
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.nyc;
  delete pkg.babel;
  pkg.scripts = { start: './node_modules/.bin/json2server' };
  await Promise.all([
    writeFile('dist/server.json', JSON.stringify(serverJson, undefined, 2)),
    writeFile('dist/j2s.json', JSON.stringify(configJson, undefined, 2)),
    writeFile('dist/package.json', JSON.stringify(pkg, undefined, 2)),
  ]);
}

main();
