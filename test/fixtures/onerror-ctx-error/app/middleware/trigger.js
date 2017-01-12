'use strict';

module.exports = () => {
  return function* (next) {
    yield next;
    this.logger.info('log something, then error happend.');
  };
};
