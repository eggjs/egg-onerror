'use strict';

module.exports = app => {
  app.get('/error', app.controller.home.throwError);
  app.get('/eggerror', app.controller.home.throwEggError);
  app.post('/eggexception', app.controller.home.throwEggException);
};
