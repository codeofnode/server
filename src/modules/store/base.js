/* eslint class-methods-use-this:0, no-unused-vars:0, no-param-reassign: 0 */
import EventEmitter from 'events';
import BulkAPI from 'bulkapi';

/**
 * An instance of [Promise]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}.
 * @typedef {Promise} Promise
 */

const undoOperation = function undoOperation(undos, evnt, noId, coll, id, cont, prevData) {
  if (!Object.hasOwnProperty.call(undos, coll)) {
    undos[coll] = {};
  }
  if (!Object.hasOwnProperty.call(undos[coll], id)) {
    undos[coll][id] = {
      data: prevData || cont,
      call: evnt,
      _id: noId ? undefined : id,
    };
  }
};

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
  constructor({ url, prefix, defaultPageSize = 10 }) {
    super();
    this.dburl = url;
    this.defaultPageSize = defaultPageSize;
    this.dbprefix = prefix || 'app_';
    this.bulkOp = new BulkAPI((req, res) => {
      let ar = req.body;
      if (!(Array.isArray(ar))) {
        ar = [ar];
      }
      this[req.method].call(this, ...(ar.concat([{ prevData: 1 }])))
        .then((dt) => {
          res.end(dt);
        })
        .catch((er) => {
          res.statusCode = 400;
          res.end(er);
        });
    }, undefined, undefined, function success(data) {
      this.end(null, data);
    }, function fail(err) {
      this.end(err);
    });
  }

  /**
   * Emitting the db event
   * @param {String} event - the event string
   * @param {Object} content - the content of emitted document
   */
  emitDbEvent(event, content) {
    const evs = event.split(':');
    this.emit(evs[0], ...(evs.slice(1).concat(content)));
    this.emit(evs.slice(0, 2).join(':'), ...(evs.slice(2).concat(content)));
    this.emit(event, content);
  }

  /**
   * resolving the collection name with the prefix
  getCollection(name) {
    // to extend
  }
   */

  /**
   * get a previous a document based on options.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
   */
  async getPrevDoc(coll, _id, options) {
    let prevData;
    if (options && options.prevData) {
      prevData = await this.read(coll, _id);
      if (!prevData) throw new Error(`Record not exists with id ${_id}`);
    }
    return prevData;
  }

  /**
   * connecting to db
  async connectDb() {
    // to extend
  }
   */

  /**
   * generate a random id
   * @return {string} text - return random string id
  static GenId() {
    // to extend
  }
   */

  /**
   * Performs a set of transactions, as bulk operationo. Either all or none.
   * Currently not suitable for concurrent transactions.
   * @param {Object} req - the transactions
   * @param {String} req.url - then collection name
   * @param {String} req.method - the method to call
   * @param {*} req.body - the array of parameters
   * @return {Object[]} the results
   */
  async bulk(req) {
    const undos = {};
    this.on('update', undoOperation.bind(this, undos, 'write', false));
    this.on('write', undoOperation.bind(this, undos, 'del', false));
    this.on('delete', undoOperation.bind(this, undos, 'write', true));
    return new Promise((res, rej) => {
      this.bulkOp.callbulk({
        url: 'POST',
        method: 'bulk',
        body: req,
      }, {
        end: (er, dt) => {
          if (er) {
            const ar = [];
            Object.keys(undos).forEach((cl) => {
              Object.keys(undos[cl]).forEach((id) => {
                ar.push(this[undos[cl][id].call](cl, undos[cl][id]._id, undos[cl][id].data));
              });
            });
            Promise.all(ar).then().then(() => {
              rej(er);
            });
          } else {
            res(dt);
          }
        },
      });
    });
  }

  /**
   * list all the entries
   * @param {string} coll - the collection, that should be read
   * @param {object} filter - the filter to apply
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
  async list(coll, filter, options) {
    // to extend
  }
   */

  /**
   * list all the entries
   * @param {string} coll - the collection, that should be read
   * @param {object} filter - the filter to apply
   * @param {object} options - the options to list the collection
   * @return {Promise} promise - return a promise
   */
  async listAll(coll, filter, options) {
    const result = { total: 0 };
    const firstResult = await this.list(coll, filter, Object.assign({}, options, {
      defaultPageSize: undefined,
      count: true,
    }));
    result.records = new Array(firstResult.total);
    result.total = firstResult.total;
    Object.assign(result.records, firstResult.records);
    const restOfResults = [];
    for (let point = result.records.length; point < result.total; point += this.defaultPageSize) {
      restOfResults.push(this.list(coll, filter, Object.assign({}, options, {
        defaultPageSize: undefined,
        skip: point,
        count: false,
      })));
    }
    (await Promise.all(restOfResults)).forEach((res, ind) => {
      let point = (ind + 1) * this.defaultPageSize;
      res.records.forEach((rc) => {
        result.records[point] = rc;
        point += 1;
      });
    });
    if (result.records.length !== result.total) {
      result.warning = 'Records count were changed while fetching the records.';
    }
    return result;
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
  listcolls() {
    // to extend
  }
   */

  /**
   * read a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the document id, that should be read
   * @param {object} fields - the fields to retrieve
   * @return {Promise} promise - return a promise
  async read(coll, _id, fields) {
    // to extend
  }
   */

  /**
   * create or update a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be created/updated
   * @param {object} data - the content in to write
   * @return {Promise} promise - return a promise
  async write(coll, _id, data) {
    // to extend
  }
   */

  /**
   * delete a document.
   * @param {string} coll - the collection, that should be read
   * @param {string} _id - the doc id at which, that should be deleted
   * @return {Promise} promise - return a promise
  async del(coll, _id) {
    // to extend
  }
   */

  /**
   * create a collection.
   * @param {string} coll - the new collection, that should be created
   * @return {Promise} promise - return a promise
  mkcoll() { // eslint-disable-line
    // do nothing
  }
   */

  /**
   * remove a collection.
   * @param {string} coll - the collection name that should be deleted
   * @return {Promise} promise - return a promise
  rmcoll(coll) {
    // to extend
  }
   */
}

export default Store;
