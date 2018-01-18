import LokiJS from 'lokijs';
import Base from './base';
import { pick } from '../util';

/**
 * @module LokiJSStore
 */

/**
 * The Store class
 * @class
 */
class Store extends Base {
  /**
   * method to convert $loki in document to _id and vice verca
   * @param {object} doc - the input document or filter
   * @return {Object} mdoc - return the modified document
   */
  static resolveId(doc, reverse) {
    let key1 = '$loki';
    let key2 = '_id';
    if (reverse) {
      [key1, key2] = [key2, key1];
    }
    const dc = Object.assign({}, doc);
    if (Object.prototype.hasOwnProperty.call(dc, key1)) {
      dc[key2] = dc[key1];
      delete dc[key1];
    }
    return dc;
  }

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
    return this.db.getCollection(this.dbprefix + name);
  }

  /**
   * generate a random id
   * @return {string} text - return random string id
   */
  static GenId() {
    throw new Error('Id generation is not available currently.');
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
    const fl = Store.resolveId(filter, true);
    let total = 0;
    const collection = this.getCollection(coll);
    if (collection) {
      let cursor = collection.chain().find(fl);
      if (typeof sort === 'object') {
        const sortKey = Object.keys(sort).shift();
        cursor = cursor.simplesort(sortKey, sort[sortKey] === -1);
      }
      const records = cursor.offset(skip).limit(limit).data().map((ob) => {
        if (!fields) {
          return ob.$loki;
        }
        return Store.resolveId(pick(ob, ...(Object.keys(fields))));
      });
      if (count) {
        total = collection.count((typeof fl === 'object' && fl && Object.keys(fl).length)
          ? fl : undefined);
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
  listcolls() {
    return this.db.collections.map(cl => cl.name.substring(this.dbprefix.length));
  }

  /**
   * read a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the document id, that should be read
   * @param {object} fields - the fields to retrieve
   * @return {Promise} promise - return a promise
   */
  async read(coll, _id, fields) {
    const doc = this.getCollection(coll).get(_id);
    const cont = Store.resolveId(pick(doc, ...(Object.keys(fields || doc))));
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
      collection.findAndUpdate({ $loki: _id }, dc => Object.assign(dc, data));
      this.emit('doc:update', coll, _id, data);
      return 1;
    }
    const ob = collection.insert(data);
    this.emit('doc:create', coll, ob.$loki, data);
    return ob.$loki;
  }

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @return {Promise} promise - return a promise
   */
  async del(coll, _id) {
    this.getCollection(coll).findAndRemove({ $loki: _id });
    this.emit('doc:delete', coll, _id);
    return 1;
  }

  /**
   * create a collection.
   * @param {string} coll - the new collection, that should be created
   * @param {Object} opts - the options to create collection
   * @return {String} coll - the collection name
   */
  mkcoll(coll, opts) {
    this.db.addCollection(this.dbprefix + coll, opts);
    return 1;
  }

  /**
   * remove a collection.
   * @param {string} coll - the collection name that should be deleted
   * @return {String} coll - the collection name
   */
  rmcoll(coll, opts) {
    this.db.removeCollection(this.dbprefix + coll, opts);
    return 1;
  }
}

export default Store;
