/* eslint no-await-in-loop:0 */

/**
 * @module migration
 */

async function waitForMigrationFinish(store, collection, interval) {
  const migDoc = await store.findOne(collection);
  if (!migDoc) {
    return {};
  }
  if (migDoc.isMigrating) {
    await AppImport('.util').delay(interval);
    await waitForMigrationFinish(store, collection, interval);
    return false;
  }
  return migDoc;
}

/**
 * The Migration class
 * @class
 */
class Migration {
  /**
   * Create an instance of migration class
   * @param {object} configOptions - the global config
   */
  constructor(configOptions) {
    this.migdir = AppImport('.util').resolvePath(configOptions.migrationdir, 'migrations');
    this.store = configOptions.$store;
    this.logger = configOptions.$logger;
    this.collection = AppImport('.util')
      .lastValue(configOptions, 'migration', 'collection') || 'migration';
    this.interval = AppImport('.util')
      .lastValue(configOptions, 'migration', 'interval') || 1000;
  }

  /**
   * start the migration
   */
  async start() {
    this.store.mkcoll('migration');
    let migDoc = (await waitForMigrationFinish(this.store, this.collection, this.interval));
    if (migDoc && !(migDoc.isMigrating)) {
      const retOb = await this.store.write(this.collection, migDoc._id, { isMigrating: true });
      if (!migDoc._id) {
        migDoc = retOb;
      }
      let migs;
      try {
        migs = AppImport('fs').readdirSync(this.migdir);
      } catch (er) {
        if (er.code === 'ENOENT') {
          migs = [];
        } else {
          throw er;
        }
      }
      const runLen = migs.length;
      const undo = [];
      let foundErr = false;
      for (let run = migDoc.lastMigrationNumber; run < runLen; run += 1) {
        const mig = AppImport(migs[run]);
        try {
          await mig.up(this.store, this.logger);
        } catch (er) {
          foundErr = er;
          break;
        }
        undo.push(mig.down);
      }
      let newMigNum = migs.length;
      if (foundErr) {
        const undoLen = undo.length;
        this.logger.error(foundErr);
        for (let k = 0; k < undoLen; k += 1) {
          if (typeof undo[k] === 'function') {
            await undo[k](this.store, this.logger);
          }
        }
        newMigNum = migDoc.lastMigrationNumber;
      }
      await this.store.write(this.collection, migDoc._id, {
        isMigrating: false,
        lastMigrationNumber: newMigNum,
      });
    }
  }
}

export default Migration;
