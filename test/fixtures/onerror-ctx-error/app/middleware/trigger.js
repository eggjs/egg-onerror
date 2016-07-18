'use strict';

module.exports = function () {
  return function* (next) {
    yield next;
    this.logger.info('log something, then error happend.');
  };
};
