import EventEmitter from 'events';
import { CronJob } from 'cron';
import FunctionsMap from './functions';

/**
 * @module Scheduler
 */

/**
 * The Scheduler class
 * @class
 */
class Scheduler extends EventEmitter {
  /**
   * Create an instance of Scheduler class
   * @param {Object} configOptions - the global config
   * @param {String} configOptions.scheduler.collection - the name of the collection to store jobs
   * @param {Object[]} configOptions.scheduler.jobs - the jobs array. see [documentation]{@link https://www.npmjs.com/package/cron}
   */
  constructor(configOptions) {
    super();
    this.store = configOptions.$store;
    this.logger = configOptions.$logger;
    this.collection = AppImport('.util')
      .lastValue(configOptions, 'scheduler', 'collection') || 'cron';
    let jobsMap = AppImport('.util').lastValue(configOptions, 'scheduler', 'jobs');
    if (typeof jobsMap !== 'object' || jobsMap === null || Array.isArray(jobsMap)) {
      jobsMap = {};
    }
    this.jobsMap = jobsMap;
    this.jobsInstance = {};
  }

  /**
   * Call one cron
   * @param {Object} cron - the cron object
   */
  async callOneCron(cron) {
    await this.store.write(this.collection, cron._id, { status: 2 });
    try {
      await FunctionsMap[cron.name](this.store, this.logger, ...cron.params);
    } catch (er) {
      return this.store.write(this.collection, cron._id, { status: 0, error: er });
    }
    return this.store.write(this.collection, cron._id, { status: 1 });
  }

  /**
   * To be called when the cron completes
   * @param {String} name - the job name to complete with
   */
  async completeCron(name) {
    this.logger.info(`Job ${name} completed at ${new Date()}.`);
  }

  /**
   * Call the crons that are in queue or yet to be executed
   * @param {String} name - the job name to run with
   */
  async callCron(name) {
    const docs = await this.store.listAll(this.collection, {
      name,
      enabled: true,
      status: { $lt: 1 }, // to execute failed or the ones in queue
    }, { params: 1 });
    await Promise.all(docs.map(this.callOneCron.bind(this)));
  }

  /**
   * Init the scheduler to assign a collection
   * @chainable
   */
  init() {
    this.store.mkcoll(this.collection);
    Object.keys(this.jobsMap).forEach((jb) => {
      if (typeof FunctionsMap[jb] === 'function') {
        this.jobsInstance[jb] = new CronJob(Object.assign({}, this.jobsMap[jb], {
          onTick: this.callCron.bind(this, jb),
          onComplete: this.onComplete.bind(this, jb),
          start: true,
        }));
      } else {
        delete this.jobsMap[jb];
      }
    });
    return this;
  }

  /**
   * Enable the scheduler
   * @param {String} jobName - the job to start
   * @chainable
   */
  enable(jobName) {
    this.jobsInstance[jobName].start();
    return this;
  }

  /**
   * Disable the scheduler
   * @param {String} jobName - the job to start
   * @chainable
   */
  disable(jobName) {
    this.jobsInstance[jobName].stop();
    return this;
  }

  /**
   * Enable a job
   * @param {String} jobId - the job id to enable
   * @chainable
   */
  enableJob(jobId) {
    return this.store.write(this.collection, jobId, { enabled: true });
  }

  /**
   * Disable a job
   * @param {String} jobId - the job id to disable
   * @chainable
   */
  disableJob(jobId) {
    return this.store.write(this.collection, jobId, { enabled: false });
  }

  /**
   * create a job to schedule
   * @param {String} name - the key name of the subscribers
   * @param {*} params - the array of parameters to pass on tick.
   */
  add(name, params) {
    if (!this.jobsMap[name]) throw new Error('Incorrect job name.');
    this.store.write(this.collection, null, {
      name,
      params,
      enabled: true,
      status: -1, // 0 means, to be executed
    });
  }
}

export default Scheduler;
