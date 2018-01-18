import { join, isAbsolute } from 'path';
import { promisify } from 'util';

/**
 * @module Utility
 */

/**
 * no operation function
 */
export function noop() {}

/**
 * pick a few properties from a object and return
 */
export function pick(o, ...props) {
  return Object.assign({}, ...props.map(prop => ({ [prop]: o[prop] })));
}

/**
 * padding a string to the left
 */
export const padLeft = (s, c, n) => c.repeat(n - s.length) + s;

/**
 * padding a string to the right
 */
export const padRight = (s, c, n) => s + c.repeat(n - s.length);

/**
 * promisify a function
 */
export const promisified = fun => promisify(fun);

/**
 * delay for some time
 */
export const delay = interval => new Promise((res) => {
  setTimeout(res, interval);
});

/**
 * resolve a string for path
 */
export const resolvePath = (st, def) => {
  let str = st;
  if (typeof str !== 'string' || !str.length) {
    str = def;
  }
  if (!isAbsolute(str)) {
    str = join(process.cwd(), str);
  }
  return str;
};
