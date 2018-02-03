/* eslint global-require:0, import/no-dynamic-require:0 */

/**
 * @module import
 */

/**
 * The Import class
 * @class
 */
class Import {
  /**
   * Create an instance of Import class
   * @param {String} rootDir - the root directory of app
   */
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  /**
   * load a module
   * @param {String} name - name of the module. Use a dot as prefix if its an internal module.
   */
  load(name) {
    let toRet;
    if (name.charAt(0) === '.') {
      try {
        // eslint-disable-next-line import/no-dynamic-require
        toRet = require(this.rootDir + name.substring(1));
      } catch (er) {
        // default is set below
      }
    }
    if (!toRet) {
      toRet = require(name);
    }
    return toRet.default ? toRet.default : toRet;
  }

}

export default Import;
