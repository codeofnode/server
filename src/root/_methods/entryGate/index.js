/* eslint no-unused-vars:0 */

module.exports = function MainBlock(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  function func(vars, methods, req, res) {
    req.requestId = Date.now();
    if (GLOBAL_APP_CONFIG.SERVER_STATE !== GLOBAL_APP_CONFIG.appStates.LISTENING) {
      return 'We are currently in maintenance mode.';
    }
    return undefined;
  }

  return func;
};
