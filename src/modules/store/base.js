/* eslint class-methods-use-this:0, no-unused-vars:0 */
import EventEmitter from 'events';

/**
 * An instance of [Promise]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}.
 * @typedef {Promise} Promise
 */

/**
 * @module BaseStore
 */

/**
 * The Store class
 * @class
 */
class Store extends EventEmitter {
  /**
   * Create an instance of Store class
   * @param {Object} config - the application config
   */
  constructor({ url, prefix }) {
    super();
    this.dburl = url;
    this.dbprefix = prefix || 'app_';
  }

  /**
   * resolving the collection name with the prefix
   */
  getCollection(name) {
    // to extend
  }

  /**
   * connecting to db
   */
  async connectDb() {
    // to extend
  }

  /**
   * generate a random id
   * @return {string} text - return random string id
   */
  static GenId() {
    // to extend
  }

  /**
   * list all the entries
   * @param {string} coll - the collection, that should be read
   * @param {object} filter - the filter to apply
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
   */
  async list(coll, filter, options) {
    // to extend
  }

  /**
   * find one entry
   * @param {string} coll - the collection, that should be read
   * @param {object} filter - the filter to apply
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
   */
  async findOne(coll, filter, options = {}) {
    return (await this.list(coll, filter, Object.assign(options, { limit: 1 }))).records.shift();
  }

  /**
   * list all the collections.
   * @return {Promise} promise - return a promise
   */
  listcolls() {
    // to extend
  }

  /**
   * read a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the document id, that should be read
   * @param {object} fields - the fields to retrieve
   * @return {Promise} promise - return a promise
   */
  async read(coll, _id, fields) {
    // to extend
  }

  /**
   * create or update a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be created/updated
   * @param {object} data - the content in to write
   * @return {Promise} promise - return a promise
   */
  async write(coll, _id, data) {
    // to extend
  }

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @return {Promise} promise - return a promise
   */
  async del(coll, _id) {
    // to extend
  }

  /**
   * create a collection.
   * @param {string} coll - the new collection, that should be created
   * @return {Promise} promise - return a promise
   */
  mkcoll() { // eslint-disable-line
    // do nothing
  }

  /**
   * remove a collection.
   * @param {string} coll - the collection name that should be deleted
   * @return {Promise} promise - return a promise
   */
  rmcoll(coll) {
    // to extend
  }
}

export default Store;
