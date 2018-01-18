/* eslint import/no-extraneous-dependencies:0, import/no-unresolved:0, import/extensions:0 */

import { MongoClient, ObjectId } from 'mongodb';
import Base from './base';
import { promisified } from '../util';

const pConnect = promisified(MongoClient.connect);

/**
 * An instance of [Promise]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}.
 * @typedef {Promise} Promise
 */

/**
 * @module MongoDBStore
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
    const client = (await ((pConnect)(this.dburl)));
    this.db = client.db(client.s.options.dbName);
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
    return new ObjectId();
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
   * list all the collections.
   * @return {Promise} promise - return a promise
   */
  async listcolls() {
    return (await this.db.listCollections().toArray())
      .map(cl => cl.name.substring(this.dbprefix.length));
  }

  /**
   * read a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the document id, that should be read
   * @param {object} fields - the fields to retrieve
   * @return {Promise} promise - return a promise */
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
      await collection.findOneAndUpdate({ _id }, { $set: data });
      this.emit('doc:update', coll, _id, data);
      return 1;
    }
    return (await collection.insertOne(data)).insertedId.toString();
  }

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @return {Promise} promise - return a promise
   */
  async del(coll, _id) {
    await this.getCollection(coll).deleteOne({ _id });
    this.emit('doc:delete', coll, _id);
    return 1;
  }

  /**
   * remove a collection.
   * @param {string} coll - the collection name that should be deleted
   * @return {Promise} promise - return a promise
   */
  rmcoll(coll) {
    this.getCollection(coll).drop();
    return 1;
  }
}

export default Store;
