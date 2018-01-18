/* eslint no-unused-vars:0, global-require:0, no-param-reassign:0, import/no-dynamic-require:0 */

module.exports = function MainBlock(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  const rootDir = `${process.cwd()}/${(GLOBAL_APP_CONFIG && GLOBAL_APP_CONFIG.moduledir) || 'modules'}/`;
  let loglevel = Number(GLOBAL_APP_CONFIG.loglevel);
  if (isNaN(loglevel)) loglevel = 2;

  GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.STARTING;
  const ImportClass = require(`${rootDir}import`).default;
  const appImport = new ImportClass(rootDir);
  global.AppImport = appImport.load.bind(appImport);

  GLOBAL_APP_CONFIG.$store =
    new (AppImport(`.store/${GLOBAL_APP_CONFIG.db.type}`))(GLOBAL_APP_CONFIG.db);
  GLOBAL_APP_CONFIG.$notifier = new (AppImport('.notifier'))(GLOBAL_APP_CONFIG);
  GLOBAL_APP_CONFIG.$logger = new (AppImport('.logger'))(loglevel);
  Object.assign(AppImport('.util'), GLOBAL_METHODS);

  const fixturer = new (AppImport('.fixture'))(GLOBAL_APP_CONFIG);
  const migrator = new (AppImport('.migration'))(GLOBAL_APP_CONFIG);

  async function initAndMigrate() {
    GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.CONNECTING_DB;
    await GLOBAL_APP_CONFIG.$store.connectDb();
    GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.INITIALIZING;
    try {
      await fixturer.start();
    } catch (er) {
      if (er.code !== 'MODULE_NOT_FOUND') {
        GLOBAL_APP_CONFIG.$logger.warn('Fixture failed started because of :', er.message);
      }
    }
    GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.MIGRATING;
    await migrator.start();
  }

  initAndMigrate().then(() => {
    GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.LISTENING;
  });

  process.on('unhandledRejection', (reason) => {
    GLOBAL_APP_CONFIG.$logger.error('========= Unhandled Rejection =========>');
    throw reason;
  });

  function func() {
    // nothing to do
  }

  return func;
};
