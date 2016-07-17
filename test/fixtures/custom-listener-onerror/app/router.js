'use strict';

module.exports = function (app) {
  app.get('/', function*() {
    const err = new Error('mock error');
    err.name = this.query.name || 'Error';
    throw err;
  });
};
