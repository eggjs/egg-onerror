'use strict';

module.exports = app => {
  app.get('/', async () => {
    const err = new Error('mock error');
    err.name = this.query.name || 'Error';
    throw err;
  });
};
