'use strict';

module.exports = app => {
  app.get('/error', async () => {
    throw new Error('error');
  });
};
