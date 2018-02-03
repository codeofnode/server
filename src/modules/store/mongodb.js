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
   * @param {String} inputId - the input string id to convert into object id
   * @return {ObjectId} _id - return random object id
   */
  static GenId(inputId) {
    return new ObjectId(inputId);
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
    const cont = await this.getCollection(coll).findOne({ _id: Store.GenId(_id) }, { fields });
    this.emitDbEvent(`read:${coll}:${_id}`, cont);
    return cont;
  }

  /**
   * create or update a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be created/updated
   * @param {object} data - the content in to write
   * @param {object} options - the options to update the collection
   * @return {Promise} promise - return a promise
   */
  async write(coll, _id, data, options) {
    const collection = this.getCollection(coll);
    if (_id) {
      const prevData = await this.getPrevDoc(coll, Store.GenId(_id), options);
      await collection.findOneAndUpdate({ _id: Store.GenId(_id) }, { $set: data });
      this.emitDbEvent(`update:${coll}:${_id}`, data, prevData);
      return 1;
    }
    const newId = (await collection.insertOne(data)).insertedId.toString();
    this.emitDbEvent(`create:${coll}:${newId}`, data);
    return newId;
  }

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @param {object} options - the options to delete the collection
   * @return {Promise} promise - return a promise
   */
  async del(coll, _id, options) {
    const prevData = await this.getPrevDoc(coll, Store.GenId(_id), options);
    await this.getCollection(coll).deleteOne({ _id: Store.GenId(_id) });
    this.emitDbEvent(`delete:${coll}:${_id}`, prevData);
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
