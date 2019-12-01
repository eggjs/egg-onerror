'use strict';

module.exports = app => {
  app.get('/500', function* () {
    this.throw(500, 'hi, this custom 500 page');
  });
};
