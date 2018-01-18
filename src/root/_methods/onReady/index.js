/* eslint no-unused-vars:0, no-param-reassign:0  */

module.exports = function MainBlock(GLOBAL_APP_CONFIG, GLOBAL_METHODS, GLOBAL_VARS, GLOBAL_API) {
  function func(server) {
    GLOBAL_APP_CONFIG.SERVER_STATE = GLOBAL_APP_CONFIG.appStates.STARTED;
    GLOBAL_APP_CONFIG.$notifier.notifyAll('server:started');
  }

  return func;
};
