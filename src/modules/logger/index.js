/* eslint no-console:0 */

/**
 * @module Logger
 */

/**
 * The Logger class
 * @class
 */
class Logger {
  /**
   * Create an instance of Logger class
   * @param {loglevel} loglevel - the log level (prod: 0, stage: 1, dev: 2 )
   */
  constructor(loglevel) {
    this.loglevel = loglevel;
  }

  /**
   * log the errors
   */
  error(...args) {
    if (this.loglevel >= 0) {
      console.error(...args);
    }
  }

  /**
   * log the warning
   */
  warn(...args) {
    if (this.loglevel > 0) {
      console.warn(...args);
    }
  }

  /**
   * debugging logs
   */
  log(...args) {
    if (this.loglevel > 1) {
      console.log(...args);
    }
  }
}

export default Logger;
