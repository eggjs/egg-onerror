'use strict';

module.exports = app => {
  app.get('/mockerror', async () => {
    // eslint-disable-next-line
    hi.foo();
  });

  app.get('/mock4xx', async () => {
    const err = new Error('4xx error');
    err.status = 400;
    throw err;
  });

  app.get('/500', async () => {
    this.status = 500;
    this.body = 'hi, this custom 500 page';
  });

  app.get('/special', async () => {
    this.errorPageUrl = '/specialerror';
    // eslint-disable-next-line
    hi.foo();
  });
};
