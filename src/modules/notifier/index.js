/* eslint no-unused-vars:0, no-console:0 */
import EventEmitter from 'events';

/**
 * @module Notifier
 */

/**
 * The Notifier class
 * @class
 */
class Notifier extends EventEmitter {
  /**
   * Create an instance of Notifier class
   * @param {config} config - the global config options
   */
  constructor(config) {
    super();
    this.subscribers = {};
  }

  /**
   * create a subscriber
   * @param {string} name - the key name of the subscribers
   * @return {object} ins - the instance of event emitter
   */
  subscribe(name) {
    this.subscribers[name] = new EventEmitter();
    return this.subscribers[name];
  }

  /**
   * Notify all the subscribers
   */
  notifyAll(...args) {
    this.emit(...args);
  }

  /**
   * Notify a subscribers
   * @param {string} name - whom to notify
   */
  notify(name, ...args) {
    if (this.subscribers[name] instanceof EventEmitter) {
      this.subscribers[name].emit(...args);
    }
  }
}

export default Notifier;
