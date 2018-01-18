import LokiJS from 'lokijs';
import Base from './base';
import { promisified } from '../util';

/**
 * @module LokiJSStore
 */

/**
 * The Store class
 * @class
 */
class Store extends Base {
  /**
   * connecting to db
   */
  async connectDb() {
    this.db = new LokiJS(this.dburl);
  }

  /**
   * resolving the collection name with the prefix
   */
  getCollection(name) {
    return this.db.collection(this.dbprefix + name);
  }

  /**
   * generate a random id
   * @return {string} text - return random string id
   */
  static GenId() {
    throw new Error('Id generation is not available currently.')
  }

  /**
   * list all the entries
   * @param {string} coll - the collection, that should be read
   * @param {object} filter - the filter to apply
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
   */
  async list(coll, filter, options) {
    const { sort, skip = 0, limit = 10, count, fields } = options || {};
    let total = 0;
    const collection = this.getCollection(coll);
    if (collection) {
      let cursor = collection.find(filter, { fields });
      if (sort) cursor = cursor.sort(sort);
      let records = (await cursor.skip(skip).limit(limit).toArray());
      if (!fields) {
        records = records.map(doc => doc._id);
      }
      if (count) {
        total = await collection.count(filter);
        return { records, total };
      }
      return { records };
    }
    return { records: [] };
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
    return this.db.listCollections().toArray();
  }

  /**
   * read a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the document id, that should be read
   * @param {object} fields - the fields to retrieve
   * @return {Promise} promise - return a promise
   */
  async read(coll, _id, fields) {
    const cont = await this.getCollection(coll).findOne({ _id }, { fields });
    this.emit('doc:read', coll, _id, cont);
    return cont;
  }

  /**
   * create or update a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be created/updated
   * @param {object} data - the content in to write
   * @return {Promise} promise - return a promise
   */
  async write(coll, _id, data) {
    const collection = this.getCollection(coll);
    if (_id) {
      const { value } = await collection.findOneAndUpdate({ _id }, { $set: data });
      this.emit('doc:update', coll, _id, value);
      return value;
    }
    const { insertedId } = await collection.insertOne(data);
    const newDoc = Object.assign({ _id: insertedId }, data);
    this.emit('doc:create', coll, insertedId, newDoc);
    return newDoc;
  }

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @return {Promise} promise - return a promise
   */
  async del(coll, _id) {
    const { result } = await this.getCollection(coll).deleteOne({ _id });
    this.emit('doc:delete', coll, _id, result);
    return result;
  }

  /**
   * create a collection.
   * @param {string} coll - the new collection, that should be created
   * @return {Promise} promise - return a promise
   */
  mkcoll() { // eslint-disable-line class-methods-use-this
    // do nothing
  }

  /**
   * remove a collection.
   * @param {string} coll - the collection name that should be deleted
   * @return {Promise} promise - return a promise
   */
  rmcoll(coll) {
    return this.getCollection(coll).drop();
  }
}

export default Store;
