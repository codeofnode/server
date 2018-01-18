/* eslint no-unused-vars:0 */

module.exports = function MainBlock(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  function func(vars, methods, req, res) {
    // setting up logger
    GLOBAL_APP_CONFIG.$logger.log(`${req.requestId} | ${(new Date()).toJSON()} | ${AppImport('.util').padRight(req.method, ' ', 7)} => ${req.parsedUrl.pathname}`);
  }
  return func;
};
