'use strict';

module.exports = app => {
  app.get('/mockerror', function* () {
    // eslint-disable-next-line
    hi.foo();
  });

  app.get('/mock4xx', function* () {
    const err = new Error('4xx error');
    err.status = 400;
    throw err;
  });

  app.get('/500', function* () {
    this.status = 500;
    this.body = 'hi, this custom 500 page';
  });

  app.get('/special', function* () {
    this.errorPageUrl = '/specialerror';
    // eslint-disable-next-line
    hi.foo();
  });
};
