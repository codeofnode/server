import allrounder from 'allrounder';
import j2s from 'json2server'
import { readdirSync } from 'fs';
import { join, sep } from 'path';

const replace = j2s.methods.replace

let globalConfig = {};
try {
  globalConfig = require(process.cwd()+'/config.sample.json');
  Object.assign(globalConfig, require(process.cwd()+'/config.json'));
} catch (er) {
}

replace(globalConfig, globalConfig);
const scanDir = join(process.cwd(), process.env.SCAN_DIR || 'src');
const currDir = process.cwd();
const appImport = new (require(`${scanDir}/modules/import`).default)(`${scanDir}/modules/`);
global.AppImport = appImport.load.bind(appImport);

readdirSync(__dirname).map((fl) => {
  if (fl.endsWith('.json')) {
    var json = require(join(__dirname, fl));
    if (!json.vars) json.vars = {};
    json.vars = replace(json.vars, globalConfig);
    json.vars.plat = { scanDir, currDir, sep };
  }
});

const initOptions = {
  jsondir : __dirname,
  debug: "unhandledRejection",
  insecure: 1,
};

allrounder.init(initOptions);
allrounder.start();
