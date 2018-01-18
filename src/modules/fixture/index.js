/**
 * @module fixture
 */

/**
 * The Fixture class
 * @class
 */
class Fixture {
  /**
   * Create an instance of fixture class
   * @param {object} configOptions - the global config
   */
  constructor(configOptions) {
    this.fixturejs = AppImport('.util').resolvePath(configOptions.fixturejs, 'fixture');
  }

  /**
   * start the fixtures
   */
  start() {
    return AppImport(this.fixturejs);
  }

}

export default Fixture;
